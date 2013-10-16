#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:
# num - limits the number of results. Default 1000
# startTime - The beginning of the timerange. Defaults to one day
# endTime - The end of the time range. Defaults to current date.
# [onlyTopGoals] - Optional argument for getting only top goals. Default false. 
# datetime format = "2013-09-10T23:00:14+09:00"

#my $dateTimeFormat = '%Y.%m.%dT%T%O';
my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling

# OUTPUT
# Format: JSON
# title
# goalPath - string representation of the path from top goal to the current goal
# creator
# dateTime
# subGoal - list of subgoal urls

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;


require("sparql.pl");

# Configuration
$graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
$limit = uri_unescape( $q->param('num') );
if ( !defined( $limit ) ){
	$limit = 10000;
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
# Evaluates as false, if doesn't exist
$onlyTopGoals = $q->param( 'onlyTopGoals' );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select
$sparql .= ' select distinct ?goal ?title ?desc ?wisher ?subg ';

# Static where clauses
$sparql .= ' where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal dc:description ?desc.   }
       OPTIONAL { ?goal socia:subGoal  ?subg.   }
       OPTIONAL { ?goal socia:wisher   ?wisher. } ';
# Dynamic where clauses
$sparql .= ''; # TODO Add time range, when dataset supports it

# Closing, optional limit, and ordering clauses 
$sparql .= " } LIMIT 10000";



## Debug print
if ( $debug ){
	# Print paramers
	print "Content-type: text/text\r\n\r\n";
	print "DEBUG\n\n";

	print "Params:\n";	
	
	foreach $key ( $q->param ){
		print "$key: " . $q->param($key) ."\n"
	}

	print "\n\nLimit: " . $limit . "\n";
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

print $result_json;

exit;