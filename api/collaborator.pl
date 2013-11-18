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
my $goalURI = uri_unescape( $q->param('goalURI') );
my $participant = uri_unescape( $q->param('participantURI') );


print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
# The virtuoso`s json is broken, create well formatted dataset 
my $result;# = {};
#$result->{ goalURI } = $goalURI;

if ( $command eq "add" ){
	addGoalParticipant($goalURI, $participant);
		print "Added: <$participant> <$goalURI>";
}
if ( $command eq "remove" ){
	removeGoalParticipant($goalURI, $participant);
	print "ok";
}
if ( $command eq "get" ){
	$result = getGoalParticipants($goalURI);
}
	#my $js = new JSON;
	#print $js->pretty->encode($result);
print $result
exit;
# END