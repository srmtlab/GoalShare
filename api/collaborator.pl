#!/usr/bin/perl

# Api for adding a person to a goal as a collaborator

# INPUT parameters:


my $dateTimeFormat = '%Y-%m-%dT%T%z';

# OUTPUT
# Ok

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
# User 
my $command = uri_unescape( $q->param('command') );
my $parentGoalURI = uri_unescape( $q->param('goalURI') );
my $title = uri_unescape( $q->param('collaborator') );

# Generate Sparql query

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/text; charset=UTF-8\n\n";

my $result = createGoal($parentGoalURI, $title, $desiredDate, $requiredDate, $creator, $createdDate, $status, $reference);
print $result;
exit;
# END