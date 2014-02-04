#!/usr/bin/perl

# Api for inserting a goal

# INPUT parameters:



#my $dateTimeFormat = '%Y.%m.%dT%T%O';
my $dateTimeFormat = '%Y-%m-%dT%T%z';

# OUTPUT
# Ok

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;

require("sparql.pl");
require("goal_backend.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
# parentGoalURI, title, desiredDate, reference, requiredDate, creator, createdDate, status
my $goalURI = uri_unescape( $q->param('goalURI') );
my $parentGoalURI = uri_unescape( $q->param('parentGoalURI') );
my $title = uri_unescape( $q->param('title') );
my $reference = uri_unescape( $q->param('reference') );
my $relatedList = $q->param('relatedList');
my $creator = uri_unescape( $q->param('creator') );
my $status = uri_unescape( $q->param('status') );
my $description = uri_unescape( $q->param('description') );
my $locationURI = uri_unescape( $q->param('locationURI') );
my $goalWisherURI = uri_unescape( $q->param('goalWisherURI') );
my $update = uri_unescape( $q->param('update') );
#my $oldGoalURI = uri_unescape( $q->param('oldGoalURI') );

if ( defined( $q->param('requiredDate') ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		on_error => 'croak',
	);
	$requiredDate = $parser->parse_datetime( uri_unescape( $q->param('requiredDate') ) );
}
if ( defined( $q->param('desiredDate') ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		on_error => 'croak',
	);
	$desiredDate = $parser->parse_datetime( uri_unescape( $q->param('desiredDate') ) );
}
if ( defined( $q->param('createdDate') ) ){
	# Parse the parameter
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		on_error => 'croak',
	);
	$createdDate = $parser->parse_datetime( uri_unescape( $q->param('createdDate') ) );
}
if ( !defined ( $createdDate ) ){
	$createdDate = DateTime->now();
}

#if($update eq "updateIsTrue"){
#deleteGoal($goalURI, $update);
#}
# Generate Sparql query

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/text; charset=UTF-8\n\n";
# Update
if( defined $update && ! ( $update eq "" ) ){
	logGeneral("Deleting update goal!");
	deleteGoal($goalURI, "deleteTrue");
	clearParentGoalLinks($goalURI);
}

my $result = createGoal($goalURI, $parentGoalURI, $title, $description, $desiredDate, $requiredDate, $creator, $createdDate, $status, $reference, $locationURI, $goalWisherURI, $relatedList, $update);
my $js = new JSON;
print $js->pretty->encode( $result);
exit;
# END