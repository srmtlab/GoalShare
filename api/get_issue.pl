#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:

my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling

# OUTPUT
# Format: JSON 


use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;


require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
$goalURI = uri_unescape( $q->param('issueURI') );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select
$sparql .= 'select distinct ?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status
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
       OPTIONAL { ?goal dc:creator ?creator}       
     FILTER ( ?goal = <' . $goalURI . '>)
       ';
# Dynamic where clauses
$sparql .= ''; # TODO Add time range, when dataset supports it

# Closing, optional limit, and ordering clauses 
$sparql .= " } LIMIT 1";




print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );

print $result_json;

exit;
