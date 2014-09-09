#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:
# goalURI - original goals URI
# resultLimit - limits the number of results. Default 1000


# OUTPUT
# TODO: Output JSONP
# Format: JSON 
# Goal list 

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;

require("sparql.pl");

my $graph_uri = "http://collab.open-opinion.org";

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
my $goalURI = uri_unescape( $q->param('goalURI') );
my $limit = uri_unescape( $q->param('limit') );

# Generate Sparql query

# Prefix
$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX schema: <http://schema.org/>';
# Select
$sparql .= "select distinct ?goal ?title ?desc ?requiredTargetDate ?desiredTargetDate ?completedDate ?status ?locationURI ?creator ?creatorName ?imageURI ?fbURI ?weight 
 where {
     ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal dc:description ?desc.      }
       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
       #OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL { ?goal socia:requiredTargetDate ?requiredTargetDate }
       OPTIONAL { ?goal socia:desiredTargetDate ?desiredTargetDate }
       OPTIONAL { ?goal socia:completedDate ?completedDate }
       OPTIONAL { ?goal socia:status ?status    }
       OPTIONAL { ?goal dc:spatial ?locationURI}
       OPTIONAL { ?goal dc:creator ?creator}       
       #OPTIONAL { ?goal socia:subGoalOf ?parentGoal }

        OPTIONAL {?creator foaf:name ?creatorName.}
        OPTIONAL { ?creator foaf:img ?imageURI. }
        OPTIONAL { ?creator go:url ?fbURI. }

  

       GRAPH <http://collab.open-opinion.org>{
            ?aninfo socia:source ?goal.
            ?aninfo socia:target <$goalURI>.
            ?aninfo socia:weight ?weight
       }
       ?goal schema:isSimilarTo <$goalURI>
}ORDER BY DESC(?weight)";

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
my $result_json = execute_sparql( $sparql );
my $test = decode_json $result_json;
 
my %result = {};
$result->{query} = $sparql;
$result->{resultJSON} = $result_json;
$result->{goals} = [];
$result->{sourceGoal} = $goalURI;
for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
	
	# Add new goal

	$tmp = {};
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
	$tmp->{dateTime} = $test->{results}->{bindings}[$i]->{submDate}{value};

	push(@{$result->{goals}}, $tmp);
	
}


# Return the result
my $js = new JSON;
print $js->pretty->encode( $result);

exit;
