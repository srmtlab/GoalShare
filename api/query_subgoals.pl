#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:
# num - limits the number of results. Default 1000
# startTime - The beginning of the timerange. Defaults to one day
# endTime - The end of the time range. Defaults to current date.
# [onlyTopGoals] - Optional argument for getting only top goals. Default false. 
# datetime format = "2013-09-10T23:00:14+09:00"

#

my $dateTimeFormat = '%Y.%m.%dT%T%O';
#my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling

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
use threads;
use threads::shared;

require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config
my $q = CGI->new;
my @params = $q->param();

# Parse parameters
my $goalUrl = uri_unescape( $q->param('goalUrl') );

# Generate Sparql query

# Prefix
$sparql = "PREFIX dc: <http://purl.org/dc/terms/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX socia: <http://data.open-opinion.org/socia-ns#> 
select distinct ?goal ?subg ?subGoalTitle ?desc ?submDate  ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status 
 where {
    ?goal rdf:type socia:Goal.
       OPTIONAL { ?goal socia:subGoal  ?subg.
                GRAPH <http://collab.open-opinion.org>{
                      ?subg dc:title ?subGoalTitle.
                		OPTIONAL { ?subg dc:description ?desc.      }
       					OPTIONAL { ?subg dc:dateSubmitted ?submDate }
       					OPTIONAL { ?subg socia:requiredTargetDate ?requiredTargetDate }
					    OPTIONAL { ?subg socia:desiredTargetDate ?desiredTargetDate }
					    OPTIONAL { ?subg socia:completedDate ?completedDate }
					    OPTIONAL { ?subg socia:status ?status    }
					    OPTIONAL { ?subg dc:creator ?creator }
                }}
FILTER (?goal = <$goalUrl>)
}";

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $result_json = execute_sparql( $sparql );

my $test = decode_json $result_json;
#print "******* " . $test;
#my @workerThreads;

# The virtuoso`s json is broken, create well formatted dataset 
my %result = {};
$result->{subgoals} = [];

# Loop all goals and do group by
for ( $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
		#print "adding new goal\n";
		$tmp = {};
		$tmp->{parentGoal} = $test->{results}->{bindings}[$i]->{goal}{value};
		$tmp->{url} = $test->{results}->{bindings}[$i]->{subg}{value};
		$tmp->{title} = $test->{results}->{bindings}[$i]->{subGoalTitle}{value};
		$tmp->{description} = $test->{results}->{bindings}[$i]->{desc}{value};
		$tmp->{created} = $test->{results}->{bindings}[$i]->{submDate}{value};
		$tmp->{requiredTargetDate} = $test->{results}->{bindings}[$i]->{requiredTargetDate}{value};
		$tmp->{desiredTargetDate} = $test->{results}->{bindings}[$i]->{desiredTargetDate}{value};
		$tmp->{completedDate} = $test->{results}->{bindings}[$i]->{completedDate}{value};
		$tmp->{status} = $test->{results}->{bindings}[$i]->{status}{value};
		$tmp->{creator} = $test->{results}->{bindings}[$i]->{creator}{value};
		$tmp->{creatorUrl} = "http://test.com";#TODO Get url
		push(@{$result->{subgoals}}, $tmp);	
	
}


# Return the result
my $js = new JSON;

#print $js->pretty->encode( $test);
print $js->pretty->encode( $result);
#print encode_json $test;

exit;
# END
