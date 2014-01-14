#!/usr/bin/perl

# Api for adding a person to a goal as a collaborator

my $dateTimeFormat = '%Y-%m-%dT%T%z';

# OUTPUT
# Ok

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");
require("debug_log.pl");

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
# User 
my $command = uri_unescape( $q->param('command') );
my $issueURI = uri_unescape( $q->param('issueURI') );
my $deleteConfirmation = uri_unescape( $q->param('deleteConfirmation') );

my %cookies = CGI::Cookie->fetch;
my $userURI = $cookies{'userURI'}->value;
my $usr = $cookies{'userName'}->value;

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
# The virtuoso`s json is broken, create well formatted dataset 
my $result;# = {};
#$result->{ goalURI } = $goalURI;

if ( $command eq "delete" ){
	if ( $deleteConfirmation eq "deleteTrue"  && !( $usr eq "Anonymous" ) ){
		deleteIssue($issueURI, $deleteConfirmation, $userURI);
	}
}


	#my $js = new JSON;
	#print $js->pretty->encode($result);
#print $result
exit;
# END