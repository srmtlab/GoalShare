#!/usr/bin/perl

# Api for adding a person to a goal as a goal wisher

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
my $wisherURI = uri_unescape( $q->param('wisherURI') );


print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
# The virtuoso`s json is broken, create well formatted dataset 
my $result = {};
#$result->{ goalURI } = $goalURI;

my $js = new JSON;
if ( $command eq "add" ){
	$result = addGoalWisher($goalURI, $wisherURI);
	print $js->pretty->encode($result);
	#print "Added: <$wisherURI> <$goalURI>";
}
if ( $command eq "remove" ){
	removeGoalWisher($goalURI, $wisherURI);
	print "ok";
}
if ( $command eq "get" ){
	$result = getGoalWishers($goalURI);
	print $js->pretty->encode($result);
}

exit;
# END