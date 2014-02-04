#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:
# num - limits the number of results. Default 1000
# startTime - The beginning of the timerange. Defaults to one day
# endTime - The end of the time range. Defaults to current date.
# [onlyTopGoals] - Optional argument for getting only top goals. Default false. 
# datetime format = "2013-09-10T23:00:14+09:00"

#


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
no warnings 'utf8';
use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;

require("sparql.pl");
require('debug_log.pl');
# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
$num = uri_unescape( $q->param('num') );
if ( !defined( $num ) ){
	$num = 100;
}
if ( defined( $q->param('endTime') ) && !( $q->param('endTime') eq "" ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		#on_error => 'croak',
	);
	$endTime = $parser->parse_datetime( uri_unescape( $q->param('endTime') ) );
}
#if( !defined($endTime) ){
#	$endTime = DateTime->now();
#}

if ( defined( $q->param('startTime') ) && !($q->param('startTime') eq "") ){
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
		logGeneral("Startdef[$startTime]");
		logGeneral("Startdef[$endTime]");
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
	  logGeneral("Enddef[$startTime]");
		logGeneral("Enddef[$endTime]"); 
		#"DateTime->now();
	}
#if ( !defined ( $startTime ) ){
#	$startTime = $endTime->clone();
#	# Set default time range
#	$startTime->add( days => -30 );
#}

my $dateType = uri_unescape ( $q->param( 'dateType' ) );
my $onlyTopGoals = uri_unescape ( $q->param( 'onlyTopGoals' ) );
my $created = uri_unescape ( $q->param( 'created' ) );
my $keyword = uri_unescape ( $q->param( 'keyword' ) );
my $locationURI = uri_unescape ( $q->param( 'locationURI' ) );
	
my @parts = ();
if ( $locationURI ){
	logGeneral($locationURI);
	@parts = split(',', $locationURI);	
}
my $issueURI = uri_unescape( $q->param('issueURI') );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select
$sparql .= "select distinct *
 where {
    ?issue rdf:type socia:Issue.
    OPTIONAL{ ?issue dc:title ?title }
    OPTIONAL{ ?issue dc:description ?description }    
    OPTIONAL{ ?issue dc:dateSubmitted ?submittedDate }
    OPTIONAL{ ?issue dc:spatial ?locationURI }
    OPTIONAL{ ?issue socia:wisher ?wisherURI }
    ?issue dc:creator ?creator
    GRAPH <http://collab.open-opinion.org>{
        ?creator foaf:name ?creatorName.
        OPTIONAL { ?creator foaf:img ?imageURI. }
        OPTIONAL { ?creator go:url ?fbURI. }
    }
    OPTIONAL{
    	 GRAPH <http://collab.open-opinion.org>{
        OPTIONAL {?wisherURI foaf:name ?wisherName.}
        OPTIONAL { ?wisherURI foaf:img ?wisherImageURI. }
    }
    }
    ";
if ( defined($issueURI) && $issueURI ){
	$sparql .= "FILTER ( ?issue = <$issueURI>)";
}
else
{
	# Keyword search
	if ( $keyword ){
		$sparql .= " FILTER( REGEX(?title, \"$keyword\", \"i\") ) \n";
	}
	
	# Location search
	if ( scalar @parts > 0 ){
			#logGeneral("Location filter [$locationURI]");
			$sparql .= " FILTER ( ?locationURI IN (";
			for ( $i = 0; $i < scalar @parts; $i++ ){
				logGeneral("Adding <".$parts[$i].">");
				# Add new related
				if ( $i > 0 ){
					$sparql .= ", ";
				}
				$sparql .= "<".$parts[$i].">";
			}
			$sparql .= ") )";
		}
	
	# Time range searches
	# Created date = submitted date
	if ( $startTime ){	
		$sparql .= " FILTER ( ?submittedDate >= xsd:dateTime(\"" . $startTime->strftime("%Y%m%d") . "T00:00:00+09:00\") && ?submittedDate <= xsd:dateTime(\"" . $endTime->strftime("%Y%m%d") . "T23:59:00+09:00\") )\n";
	}
	
	if ( !defined($debugFlag) ){
		$sparql = $sparql .= " FILTER NOT EXISTS { ?issue socia:isDebug ?debug } ";
	}else{
		logGeneral("Debug issue");
	}
}
$sparql .= "}
ORDER BY DESC(?submittedDate)
LIMIT $num";
 
print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );
logRequest('Issue', 'queryIssues','Fetch',$sparql, $result_json);

my $test = decode_json $result_json;

# The virtuoso`s json is not good, create well formatted dataset 
my %result = {};
$result->{issues} = [];

# Loop all goals and do group by
for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
	
	# Add new goal
	#print "adding new goal\n";
	$tmp = {};
	$tmp->{issueURI} = $test->{results}->{bindings}[$i]->{issue}{value};
	$tmp->{title} = $test->{results}->{bindings}[$i]->{title}{value};
	$tmp->{description} = $test->{results}->{bindings}[$i]->{description}{value};
	$tmp->{dateSubmitted} = $test->{results}->{bindings}[$i]->{submittedDate}{value};
	$tmp->{creator} = $test->{results}->{bindings}[$i]->{creatorName}{value};
	$tmp->{creatorURI} = $test->{results}->{bindings}[$i]->{creator}{value};
	$tmp->{creatorImageURI} = $test->{results}->{bindings}[$i]->{imageURI}{value};
	$tmp->{wisherURI} = $test->{results}->{bindings}[$i]->{wisherURI}{value};
	$tmp->{wisherImageURI} = $test->{results}->{bindings}[$i]->{wisherImageURI}{value};
	$tmp->{wisherName} = $test->{results}->{bindings}[$i]->{wisherName}{value};
	$tmp->{locationURI} = $test->{results}->{bindings}[$i]->{locationURI}{value};
	push(@{$result->{issues}}, $tmp);
	
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

