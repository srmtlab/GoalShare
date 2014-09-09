#!/usr/bin/perl

# Api for adding a person to a goal as a collaborator

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
my $userURI = uri_unescape( $q->param('userURI') );
my $name = uri_unescape( $q->param('name') );
my $imageURI = uri_unescape( $q->param('imageURI') );
my $fbURI = uri_unescape( $q->param('fbURI') );
my $gpURI = uri_unescape( $q->param('gpURI') );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
# The virtuoso`s json is broken, create well formatted dataset 
my $result;# = {};
#$result->{ goalURI } = $goalURI;

if ( $command eq "add" ){
	addUser($userURI, $name, $imageURI, $fbURI, $gpURI);
}
if ( $command eq "remove" ){
	removeUser($userURI);
	print "ok";
}
if ( $command eq "getFB" ){
	$result = getUserByFBURI($fbURI);
}
if ( $command eq "getByURI" ){
	$result = getUserByURI($userURI);
}
if ( $command eq "get" ){
	$result = getUsers();
}
if ( $command eq "getGoalRelations" ){
	$result = getUserGoalRelations($userURI);
}
	#my $js = new JSON;
	#print $js->pretty->encode($result);
#print $result
exit;
# END