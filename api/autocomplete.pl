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

require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
my $type = uri_unescape( $q->param('type') );
my $sparql = "";
print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";


if ($type eq 'goals'){ 
	
	# Prefix
	$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
	PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
	PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
	PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
	PREFIX owl: <http://www.w3.org/2002/07/owl#>
	PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
	# Select
	$sparql .= "select distinct ?goal ?title
	 where {
	    ?goal rdf:type socia:Goal;
	       dc:title ?title.";
	
	
	$sparql .= "}";
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
		$tmp->{value} = $test->{results}->{bindings}[$i]->{goal}{value};
		$tmp->{label} = $test->{results}->{bindings}[$i]->{title}{value};
		push(@{$result->{goals}}, $tmp);
		
	}
	
	
	# Return the result
	my $js = new JSON;
	print $js->pretty->encode( $result);
	exit;

}
if ($type eq 'creators'){ 
	
	# Prefix
	$sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
	PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
	PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
	PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
	PREFIX owl: <http://www.w3.org/2002/07/owl#>
	PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
	# Select
	$sparql .= "select distinct ?creator ?creatorURI
where {
?goal rdf:type socia:Goal.
 ?goal dc:creator ?creator.
 ?goal dc:creator ?creatorURI.
}";
	my $result_json = execute_sparql( $sparql );
	my $test = decode_json $result_json;
	# The virtuoso`s json is not good, create well formatted dataset 
	my %result = {};
	$result->{Creators} = [];
	# Loop all goals and do group by
	for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
		
		# Add new goal
		#print "adding new goal\n";
		$tmp = {};
		$tmp->{value} = $test->{results}->{bindings}[$i]->{creator}{value};
		$tmp->{label} = $test->{results}->{bindings}[$i]->{creatorURI}{value};
		push(@{$result->{Creators}}, $tmp);
		
	}
	
	
	# Return the result
	my $js = new JSON;
	print $js->pretty->encode( $result);
	exit;

}

if ($type eq 'users'){ 
	
	# Prefix
	$sparql = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>

select distinct * where 
{
?person rdf:type foaf:Person;
foaf:name ?name;
foaf:img ?imageURI.
} ORDER BY ?name";

	my $result_json = execute_sparql( $sparql );
	my $test = decode_json $result_json;
	# The virtuoso`s json is not good, create well formatted dataset 
	my %result = {};
	$result->{users} = [];
	# Loop all goals and do group by
	for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
		
		# Add new goal
		#print "adding new goal\n";
		$tmp = {};
		$tmp->{value} = $test->{results}->{bindings}[$i]->{person}{value};
		$tmp->{label} = $test->{results}->{bindings}[$i]->{name}{value};
		$tmp->{imageURI} = $test->{results}->{bindings}[$i]->{imageURI}{value};
		push(@{$result->{users}}, $tmp);
		
	}
	# Return the result
	my $js = new JSON;
	print $js->pretty->encode( $result);
	exit;

}


print "{ result: \"Error\" }";

# END
