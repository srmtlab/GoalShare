#!/usr/bin/perl

use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

my $q = CGI->new;
my @params = $q->param();

my $command = uri_unescape( $q->param('command') );
my $parentURI = uri_unescape( $q->param('parentURI') );
my $childURI = uri_unescape( $q->param('childURI') );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
my $result;# = {};

if ($command eq "add"){
	$result = linkGoals( $parentURI, $childURI );		
}
if ($command eq "remove"){
	unlinkGoals( $parentURI, $childURI );	
}
if ($command eq "clearParents"){
	clearParentGoalLinks($childURI);	
}
if ($command eq "clearChildren"){
	clearChildGoalLinks($parentURI);	
}
if ($command eq "getParents"){
	$result = getParentGoalsByURI($childURI);
}
if ($command eq "getChildren"){
	$result = getChildGoalsByURI($parentURI);
}
my $js = new JSON;
print $js->pretty->encode( \%$result );
#print $result
exit;
# END
