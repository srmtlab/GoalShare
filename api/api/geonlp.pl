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


print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

my $q = CGI->new;
my @params = $q->param();

$name = uri_unescape( $q->param('name') );
	$arr = [];
	
	push(@arr, $name);
    my $uri = URI->new("https://geonlp.ex.nii.ac.jp/webapi/api.php");
    $uri->query_form( 
	#"format" => "application/sparql-results+json",
	"method" => "geonlp.parse", 
	"params" => "[$name]"

	);

    my $url = $uri->as_string;
    my $wget_cmd = "wget -O - --header=\"Accept: text/html,application/sparql-results+json\" --post-data \"{method:\"geonlp.parse\", params:[$name]}\" \"https://geonlp.ex.nii.ac.jp/webapi/api.php\"";
    #print "$wget_cmd\n";
    my $response = `$wget_cmd`;
    if ($response) {
	print $response;
    } else {
	print '{"results":{}}';
    }