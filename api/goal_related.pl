#!/usr/bin/perl

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

my $q = CGI->new;
my @params = $q->param();

my $command = uri_unescape( $q->param('command') );
my $goalURI = uri_unescape( $q->param('goaURI') );
my $reference = uri_unescape( $q->param('referenceURI') );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
my $result;# = {};

if ($command eq "add"){
	addGoalRelated($goalURI, $reference);		
}
if ($command eq "remove"){
	removeGoalRelated($goalURI, $reference);	
}
if ($command eq "clear"){
	clearAllGoalRelated($goalURI);	
}
if ($command eq "get"){
	$result = getGoalRelated($goalURI);
}

#print $result
exit;
# END