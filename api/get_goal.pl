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
$goalURI = uri_unescape( $q->param('goalURI') );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status  ?parentGoalTitle ?creatorName ?imageURI ?locationURI
$sparql .= 'select distinct *
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
       OPTIONAL {
GRAPH <http://collab.open-opinion.org>{
        OPTIONAL {?creator foaf:name ?creatorName.}
        OPTIONAL { ?creator foaf:img ?imageURI. }
        OPTIONAL { ?creator go:url ?fbURI. }
    }
       }
       OPTIONAL { GRAPH <http://collab.open-opinion.org>{?parentGoal dc:title ?parentGoalTitle }}
       
     FILTER ( ?goal = <' . $goalURI . '>)
       ';
# Dynamic where clauses
$sparql .= ''; # TODO Add time range, when dataset supports it

# Closing, optional limit, and ordering clauses 
$sparql .= " } LIMIT 1";




print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );

my $test = decode_json $result_json;

my %result = {};
$result->{goals} = [];

# Add new goal
	#print "adding new goal\n";
	$tmp = {};
	$tmp->{cntSubGoals} = $test->{results}->{bindings}[0]->{cntSubGoals}{value};
	#$tmp->{wishers} = [];
	$tmp->{goalURI} = $test->{results}->{bindings}[0]->{goal}{value};
	$tmp->{title} = $test->{results}->{bindings}[0]->{title}{value};
	$tmp->{requiredTargetDate} = $test->{results}->{bindings}[0]->{requiredTargetDate}{value};
	$tmp->{desiredTargetDate} = $test->{results}->{bindings}[0]->{desiredTargetDate}{value};
	$tmp->{completedDate} = $test->{results}->{bindings}[0]->{completedDate}{value};
	$tmp->{status} = $test->{results}->{bindings}[0]->{status}{value};
	$tmp->{creator} = $test->{results}->{bindings}[0]->{creator}{value};
	$tmp->{creatorURI} = $test->{results}->{bindings}[0]->{creator}{value};
	$tmp->{creatorImageURI} = $test->{results}->{bindings}[0]->{imageURI}{value};
	$tmp->{creatorName} = $test->{results}->{bindings}[0]->{creatorName}{value};
	$tmp->{parentGoalURI} = $test->{results}->{bindings}[0]->{parentGoal}{value};
	$tmp->{parentGoalTitle} = $test->{results}->{bindings}[0]->{parentGoalTitle}{value};
	$tmp->{createdDate} = $test->{results}->{bindings}[0]->{submDate}{value};
	$tmp->{dateTime} = $test->{results}->{bindings}[0]->{submDate}{value};
push(@{$result->{goals}}, $tmp);
#print $result_json;
my $js = new JSON;
print $js->pretty->encode( $result);

exit;
