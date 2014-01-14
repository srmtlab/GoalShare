#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:
# num - limits the number of results. Default 1000
# startTime - The beginning of the timerange. Defaults to one day
# endTime - The end of the time range. Defaults to current date.
# [onlyTopGoals] - Optional argument for getting only top goals. Default false. 
# datetime format = "2013-09-10T23:00:14+09:00"

#

#my $dateTimeFormat = '%Y.%m.%dT%T%O';
#my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling
my $dateTimeFormat = '%Y-%m-%dT%T%z';
#TODO Add timezone handling

# OUTPUT
# TODO: Output JSONP
# Format: JSON 
# title
# goalPath - string representation of the path from top goal to the current goal
# creator
# dateTime
# subGoal - list of subgoal urls

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;
use CGI qw/:standard/;
use CGI::Cookie;

require("sparql.pl");
require("debug_log.pl");
# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

my $goalURI = uri_unescape( $q->param('goalURI') );

# Parse parameters
	$num = uri_unescape( $q->param('num') );
	if ( !defined( $num ) ){
		$num = 10;
	}
#if( 1==1 || !$goalURI ){
	if ( defined( $q->param('endTime') ) && !($q->param('endTime') eq "") ){
		# Parse the parameter
		my $parser = DateTime::Format::Strptime->new(
			pattern => $dateTimeFormat,
			#on_error => 'undef',
		);
		$endTime = $parser->parse_datetime( uri_unescape( $q->param('endTime') ) );
	}
	
	if ( defined( $q->param('startTime') ) ){
		# Parse the parameter
		my $parser = DateTime::Format::Strptime->new(
			pattern => $dateTimeFormat,
			#on_error => 'croak',
		);
		#$startTime = $parser->parse_datetime( $q->param('startTime') );
		$startTime = $parser->parse_datetime( uri_unescape( $q->param('startTime') ) );
	}

	if( defined($startTime) && !defined($endTime) ){
		$endTime = DateTime->new(
					      year      => 2100,
					      month     => 1,
					      day       => 1,
					      hour      => 1,
					      minute    => 1,
					      second    => 1,
					      time_zone => 'America/Chicago',
					  ); 
		#"DateTime->now();
#		logGeneral("Startdef[$startTime]");
#		logGeneral("Startdef[$endTime]");
	}
	
	if( !defined($startTime) && defined($endTime) ){
		$startTime = DateTime->new(
					      year      => 1000,
					      month     => 1,
					      day       => 1,
					      hour      => 1,
					      minute    => 1,
					      second    => 1,
					      time_zone => 'America/Chicago',
					  );
#	  logGeneral("Enddef[$startTime]");
#		logGeneral("Enddef[$endTime]"); 
		#"DateTime->now();
	}
#	if ( !defined ( $startTime ) ){
#		$startTime = $endTime->clone();
#		# Set default time range
#		$startTime->add( days => -30 );
#	}
	
	my $dateType = uri_unescape ( $q->param( 'dateType' ) );
	my $onlyTopGoals = uri_unescape ( $q->param( 'onlyTopGoals' ) );
	my $created = uri_unescape ( $q->param( 'created' ) );
	my $keyword = uri_unescape ( $q->param( 'keyword' ) );
	my $locationURI = uri_unescape ( $q->param( 'locationURI' ) );
	my @goalStatus = split( ";", uri_unescape ( $q->param( 'goalStatus' ) ) );
#}
# Generate Sparql query
if($debugFlag){
	logGeneral("deb deb deb");
}
my %cookies = CGI::Cookie->fetch;
my $userURI = $cookies{'userURI'}->value;
my $usr = $cookies{'userName'}->value;
my $debug = True;
#logGeneral("User [$usr] [$userURI]");

#http://collab.open-opinion.org/resource/people/85dd5be5-0490-6af8-827b-2b71e588a36b
# Prefix
$sparql = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
select distinct *
 where {
 	?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal dc:description ?desc.      }
       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL { ?goal socia:requiredTargetDate ?requiredTargetDate }
       OPTIONAL { ?goal socia:desiredTargetDate ?desiredTargetDate }
       OPTIONAL { ?goal socia:completedDate ?completedDate }
       OPTIONAL { ?goal socia:status ?status    }
       OPTIONAL { ?goal dc:spatial ?locationURI}
       OPTIONAL { ?goal dc:creator ?creator}       
       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL { ?goal socia:wisher ?goalWisherURI }
       OPTIONAL { ?goal socia:isDebug ?debug }
";
#OPTIONAL {
#		GRAPH <http://collab.open-opinion.org>{
#		       OPTIONAL { ?creator foaf:name ?creatorName.}
#		        OPTIONAL { ?creator foaf:img ?imageURI. }
#		        OPTIONAL { ?creator go:url ?fbURI. }
#	}
#}
#if ( 1==1 || !$goalURI ){
	# Keyword search
	if ( $keyword ){
		$sparql .= " FILTER( REGEX(?title, '''$keyword''', \"i\") ) \n";
	}
	
	# Status search
	if ( @goalStatus ){
		my $f = 1;
		$sparql .= "FILTER (  "; 
		foreach my $val (@goalStatus) {
			if( $f == 1 ){
				$f = 0;
			}
			else{
				$sparql .= " || ";	
			}
	    	$sparql .= "?status = \"$val\" && 1=1";
	  	}
		$sparql .= " && 1=1  ) \n";
	}
	# Status search
	if($locationURI){
		$sparql = $sparql .= " FILTER ( ?locationURI = <$locationURI>) ";
	}
	
	if( defined($startTime) && defined($endTime)  ){
		
	
		# Time range searches
		# Created date = submitted date
		if ( ( $dateType eq 'CreatedDate' )){	
			$sparql .= " FILTER ( ?submDate >= xsd:dateTime(\"" . $startTime->strftime("%Y%m%d") . "T00:00:00+09:00\") && ?submDate <= xsd:dateTime(\"" . $endTime->strftime("%Y%m%d") . "T23:59:00+09:00\") )\n";
		}
		if ( ( $dateType eq 'DesiredDate' )){	
			$sparql .= " FILTER ( ?desiredTargetDate >= xsd:date(\"" . $startTime->strftime("%Y%m%d") . "\") && ?desiredTargetDate <= xsd:date(\"" . $endTime->strftime("%Y%m%d") . "\") )\n";
		}
		if ( ( $dateType eq 'RequiredDate' )){	
			$sparql .= " FILTER ( ?requiredTargetDate >= xsd:date(\"" . $startTime->strftime("%Y%m%d") . "\") && ?requiredTargetDate <= xsd:date(\"" . $endTime->strftime("%Y%m%d") . "\") )\n";
		}
	}
	if ( !defined($debugFlag) ){
		$sparql = $sparql .= " FILTER NOT EXISTS { ?goal socia:isDebug ?debug } ";
	}
#}else{
#	$sparql .= "FILTER ( ?goal = <$goalURI>)";
#}
$sparql .= "} 
ORDER BY DESC(?submDate)
LIMIT $num";
# 


print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );
my $test = decode_json $result_json;

# The virtuoso`s json is not good, create well formatted dataset 
my %result = {};
$result->{goals} = [];
$result->{query} = $sparql;
# Loop all goals and do group by
for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
	
	# Add new goal
	#print "adding new goal\n";
	$tmp = {};
	#$tmp->{cntSubGoals} = $test->{results}->{bindings}[$i]->{cntSubGoals}{value};
	#$tmp->{wishers} = [];
	$tmp->{url} = $test->{results}->{bindings}[$i]->{goal}{value};
	$tmp->{title} = $test->{results}->{bindings}[$i]->{title}{value};
	$tmp->{requiredTargetDate} = $test->{results}->{bindings}[$i]->{requiredTargetDate}{value};
	$tmp->{desiredTargetDate} = $test->{results}->{bindings}[$i]->{desiredTargetDate}{value};
	$tmp->{completedDate} = $test->{results}->{bindings}[$i]->{completedDate}{value};
	$tmp->{status} = $test->{results}->{bindings}[$i]->{status}{value};
	$tmp->{creator} = $test->{results}->{bindings}[$i]->{creator}{value};
	$tmp->{creatorUrl} = $test->{results}->{bindings}[$i]->{creator}{value};
	$tmp->{creatorImageURI} = $test->{results}->{bindings}[$i]->{imageURI}{value};
	$tmp->{creatorName} = $test->{results}->{bindings}[$i]->{creatorName}{value};
	#$$tmp->{path} = [];
	$tmp->{dateTime} = $test->{results}->{bindings}[$i]->{submDate}{value};
	$tmp->{createdDate} = $test->{results}->{bindings}[$i]->{submDate}{value};
	$tmp->{wisherURI} = $test->{results}->{bindings}[$i]->{goalWisherURI}{value};
	$tmp->{wisherName} = $test->{results}->{bindings}[$i]->{wisherName}{value};
	$tmp->{wisherImageURI} = $test->{results}->{bindings}[$i]->{wisherImageURI}{value};
	push(@{$result->{goals}}, $tmp);
	
}

# Build the paths to root node
# TODO IMPORTANT fix to use concurrency. Needs concurrent hash or....
#for ( $i = 0; $i < scalar @{$result->{'goals'}}; $i++ ){
#	my $path = BuildPath( $result->{'goals'}[$i]->{url} );
#	$result->{goals}[$i]->{goalPath} = $path;
#}


# Return the result
my $js = new JSON;
print $js->pretty->encode( $result);
exit;
# END


sub BuildPath{
	my $workURI = $_[0];
	my @resultArray = ();
	my $index = 0;
	my $resultString = "";
	my $isFirst = 1;
	
	 
	while ( $workURI ){
		
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
select distinct ?goal ?title ?parentGoal
 where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal socia:subGoalOf  ?parentGoal }   
       FILTER ( ?goal = <$workURI>)}";
		try{
			my $temp = execute_sparql( $query );
			my $result_json = decode_json($temp);
			
			my %pathPoint = ();
			
			if($isFirst == 1 ){
				$isFirst = 0;
			}else{
				$resultString = " > " . $resultString		
			}
			$resultString = $result_json->{results}{bindings}[0]->{title}{value} . $resultString;
			$pathPoint->{index} = $index;
			$pathPoint->{title} = $result_json->{results}{bindings}[0]->{title}{value};
			$pathPoint->{URI} = $workURI;
			
			push(@resultArray, $pathPoint );
			#print $workURI . " " .$index."\n";
			$index = $index + 1;
			$workURI = $result_json->{results}{bindings}[0]->{parentGoal}{value};
		
		} catch {
			# Error ocurrend, end building the path
			$workURI = False;
		}
	}
	print $resultString
	return $resultString;
	#return @resultArray;
}
