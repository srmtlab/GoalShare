#!/usr/bin/perl

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

my $q = CGI->new;
my @params = $q->param();

my $command = uri_unescape( $q->param('command') );
my $issueURI = uri_unescape( $q->param('issueURI') );
my $reference = uri_unescape( $q->param('referenceURI') );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
my $result;# = {};

if ($command eq "add"){
	addIssueReference($issueURI, $reference);		
}
if ($command eq "remove"){
	removeIssueReference($issueURI, $reference);	
}
if ($command eq "clear"){
	clearAllIssueReferences($issueURI);	
}
if ($command eq "get"){
	$result = getIssueReferences($issueURI);
}

#print $result
exit;
# END