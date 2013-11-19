#!/usr/bin/perl

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

my $q = CGI->new;
my @params = $q->param();

my $command = uri_unescape( $q->param('command') );
my $issueURI = uri_unescape( $q->param('issueURI') );
my $goalURI = uri_unescape( $q->param('goalURI') );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
my $result;# = {};

if ($command eq "add"){
	addIssueSollution($issueURI, $goalURI);		
}
if ($command eq "remove"){
	removeIssueSollution($issueURI, $goalURI);	
}
if ($command eq "get"){
	$result = getIssueSollutions($issueURI);
}

#print $result
exit;
# END