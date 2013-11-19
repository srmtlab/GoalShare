#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:

my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling

# OUTPUT
# Format: JSON 


use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;


require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
$issueURI = uri_unescape( $q->param('issueURI') );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select
$sparql .= 'select distinct *
 where {
    ?issue rdf:type socia:Issue.
    OPTIONAL{ ?issue dc:title ?title }
    OPTIONAL{ ?issue dc:description ?description }    
    OPTIONAL{ ?issue dc:dateSubmitted ?submittedDate }
    OPTIONAL{ ?issue dc:creator ?creator } 
     FILTER ( ?issue = <' . $issueURI . '>)
     } LIMIT 1';




print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );
my $tmpResult = decode_json $result_json;
# Convert to correct json format
$tmp = {};
$tmp->{issueURI} = $tmpResult->{results}->{bindings}[0]->{issue}{value};
$tmp->{title} = $tmpResult->{results}->{bindings}[0]->{title}{value};
$tmp->{description} = $tmpResult->{results}->{bindings}[0]->{description}{value};
$tmp->{createdDate} = $tmpResult->{results}->{bindings}[0]->{submittedDate}{value};
$tmp->{creatorURI} = $tmpResult->{results}->{bindings}[0]->{creator}{value};


my $js = new JSON;
print $js->pretty->encode($tmp);

exit;
