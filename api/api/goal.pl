#!/usr/bin/perl

# Api for adding a person to a goal as a collaborator

my $dateTimeFormat = '%Y-%m-%dT%T%z';

# OUTPUT
# Ok

use JSON;
use Try::Tiny;
use CGI qw/:standard/;
use CGI::Cookie;
use Data::Dumper;

require("sparql.pl");
require("goal_backend.pl");
require("debug_log.pl");
my $q = CGI->new;
my @params = $q->param();

# Parse parameters
# User 
my $command = uri_unescape( $q->param('command') );
my $goalURI = uri_unescape( $q->param('goalURI') );
my $deleteConfirmation = uri_unescape( $q->param('deleteConfirmation') );

my %cookies = CGI::Cookie->fetch;
my $userURI = "";
try{
	$userURI = $cookies{'userURI'}->value;
}catch{
	
};

my $usr = "";
try{
	$cookies{'userName'}->value;
}catch{
	
};

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";
# The virtuoso`s json is broken, create well formatted dataset 
my $result;# = {};
#$result->{ goalURI } = $goalURI;

if ( $command eq "delete" ){
	if ( $deleteConfirmation eq "deleteTrue" && ( !( $usr eq "Anonymous" ) || defined $debugFlag ) ){
		logGeneral("delete goal[$goalURI]");
		deleteGoal($goalURI, $deleteConfirmation);
	}
}

if ( $command eq "clear" ){
	if ( $deleteConfirmation eq "clearTrue" && ( !( $usr eq "Anonymous" ) || defined $debugFlag ) ){
		logGeneral("clear goal[$goalURI]");
		clearGoal($goalURI, $deleteConfirmation);
	}
}

if ( $command eq "getParentGoals" ){
	logGeneral("Get Parents [$goalURI] out");
	my $result = getParentGoalsByURI($goalURI);
	my $js = new JSON;
	print $js->pretty->encode( $result);
}
if ( $command eq "getGoalWishers" ){
	logGeneral("Get wishers [$goalURI]");
	my $result = getGoalWishers($goalURI);
	my $js = new JSON;
	print $js->pretty->encode( $result);
}
if ( $command eq "getGoalIssues" ){
	my $result = getGoalIssue( $goalURI );
	my $js = new JSON;
	print $js->pretty->encode( $result );
}
if ( $command eq "tree" ){
	my $connections = [];
	my $goalData = [];
	my $goals = {};
	my $result = {};
	
	handleNode( $goalURI, $goals, $connections );
	for (keys %{$goals}) {
	   push @{$goalData}, $goals->{$_};
	}
	$unique = [];
	$seen = {};
	foreach (@{$connections}){
		if ( !$seen->{$_->{parent}.$_->{child} } ){
			push(@{$unique}, $_);
			$seen->{$_->{parent}.$_->{child} } = 1;
		}
	}
	$result->{"goals"} = $goalData;
	$result->{"connections"} = $unique;
	#print Dumper $connections;
	#print Dumper $goals;
	my $js = new JSON;
	print $js->pretty->encode( $result );
}

	#my $js = new JSON;
	#print $js->pretty->encode($result);
#print $result
exit;
# END
