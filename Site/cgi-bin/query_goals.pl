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
my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling

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

require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
$num = uri_unescape( $q->param('num') );
if ( !defined( $num ) ){
	$num = 10000;
}
if ( defined( $q->param('endTime') ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		on_error => 'undef',
	);
	$endTime = $parser->parse_datetime( uri_escape( $q->param('endTime') ) );
}
if( !defined($endTime) ){
	$endTime = DateTime->now();
}

if ( defined( $q->param('startTime') ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		#on_error => 'undef',
	);
	$startTime = $parser->parse_datetime( $q->param('startTime') );
	#$startTime = $parser->parse_datetime( uri_escape( $q->param('startTime') ) );
}
if ( !defined ( $startTime ) ){
	$startTime = $endTime->clone();
	# Set default time range
	$startTime->add( days => -30 );
}

my $dateType = $q->param( 'dateType' );
my $onlyTopGoals = $q->param( 'onlyTopGoals' );
my $created = $q->param( 'created' );
my $keyword = $q->param( 'keyword' );
my $goalStatus = $q->param( 'goalStatus' );



# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select
$sparql .= "select distinct ?goal ?title ?desc ?parentGoal ?submDate (COUNT(?subg) AS ?CntSubGoals)
 where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal dc:description ?desc.      }
       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL { ?goal socia:subGoal  ?subg.}
}
GROUP BY ?goal ?title ?desc ?parentGoal ?submDate 
LIMIT $num";
# 



## Debug print
if ( $debug ){
	# Print paramers
	print "Content-type: text/text\r\n\r\n";
	print "DEBUG\n\n";

	print "Params:\n";	
	
	foreach $key ( $q->param ){
		print "$key: " . $q->param($key) ."\n"
	}

	print "\n\nNum: " . $num . "\n";
	print "startTime: $startTime \n";
	print "endTime: $endTime \n";
	print "onlyTop: $onlyTop \n";

	print "\n\nThe query!\n";
	print $sparql;

	print "\n\nThe query url encoded \n";
	print uri_escape( $sparql );

	exit();
}

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );

my $test = decode_json $result_json;

# The virtuoso`s json is not good, create well formatted dataset 
my %result = {};
$result->{goals} = [];

# Loop all goals and do group by
for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
	
	# Add new goal
	#print "adding new goal\n";
	$tmp = {};
	$tmp->{cntSubGoals} = $test->{results}->{bindings}[$i]->{cntSubGoals}{value};
	#$tmp->{wishers} = [];
	$tmp->{url} = $test->{results}->{bindings}[$i]->{goal}{value};
	$tmp->{title} = $test->{results}->{bindings}[$i]->{title}{value};
	$tmp->{creator} = $test->{results}->{bindings}[$i]->{title}{value};;
	$tmp->{creatorUrl} = "http://test.com";
	#$$tmp->{path} = [];
	$tmp->{dateTime} = $test->{results}->{bindings}[$i]->{submDate}{value};
	push(@{$result->{goals}}, $tmp);
	
}

# Build the paths to root node
# TODO IMPORTANT fix to use concurrency. Needs concurrent hash or....
for ( $i = 0; $i < scalar @{$result->{'goals'}}; $i++ ){
	my $path = BuildPath( $result->{'goals'}[$i]->{url} );
	$result->{goals}[$i]->{goalPath} = $path;
}


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
