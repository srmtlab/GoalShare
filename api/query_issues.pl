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
	$num = 100;
}
if ( defined( $q->param('endTime') ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		on_error => 'croak',
	);
	$endTime = $parser->parse_datetime( uri_unescape( $q->param('endTime') ) );
}
if( !defined($endTime) ){
	$endTime = DateTime->now();
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
if ( !defined ( $startTime ) ){
	$startTime = $endTime->clone();
	# Set default time range
	$startTime->add( days => -30 );
}

my $dateType = uri_unescape ( $q->param( 'dateType' ) );
my $onlyTopGoals = uri_unescape ( $q->param( 'onlyTopGoals' ) );
my $created = uri_unescape ( $q->param( 'created' ) );
my $keyword = uri_unescape ( $q->param( 'keyword' ) );
#my @goalStatus = split( ";", uri_unescape ( $q->param( 'goalStatus' ) ) );

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
    OPTIONAL{ ?issue dc:creator ?creator }
";

# Keyword search
if ( $keyword ){
	$sparql .= " FILTER( REGEX(?title, \"$keyword\", \"i\") ) \n";
}


# Time range searches
# Created date = submitted date
if ( ( $dateType eq 'CreatedDate' )){	
	$sparql .= " FILTER ( ?submittedDate >= xsd:date(\"" . $startTime->strftime("%Y%m%d") . "\") && ?submittedDate <= xsd:date(\"" . $endTime->strftime("%Y%m%d") . "\") )\n";
}


$sparql .= "}
LIMIT $num";
 
print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );
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
	$tmp->{creator} = $test->{results}->{bindings}[$i]->{creator}{value};
	$tmp->{creatorURI} = "http://test.com";#TODO Get url
	
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

