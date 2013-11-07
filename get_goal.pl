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


require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
$goalURI = uri_unescape( $q->param('goalURI') );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select
$sparql .= 'select distinct ?goal ?title ?desc ?wisher ?subg ?submDate ?subGoalTitle
 where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal dc:description ?desc.      }
       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
       OPTIONAL { ?goal socia:subGoal  ?subg.
                GRAPH <http://collab.open-opinion.org>{
                      ?subg dc:title ?subGoalTitle.
                }
       }
       OPTIONAL { ?goal socia:wisher   ?wisher.}  
       FILTER ( ?goal = <' . $goalURI . '>)
       ';
# Dynamic where clauses
$sparql .= ''; # TODO Add time range, when dataset supports it

# Closing, optional limit, and ordering clauses 
$sparql .= " } LIMIT";



## Debug print
if ( $debug ){
	# Print paramers
	print "Content-type: text/text\r\n\r\n";
	print "DEBUG\n\n";

	print "Params:\n";	
	
	foreach $key ( $q->param ){
		print "$key: " . $q->param($key) ."\n"
	}

	print "\n\ngoalUri: " . $goalURI . "\n";

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
