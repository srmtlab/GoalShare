#!/usr/bin/perl

# Api for inserting a goal
my $dateTimeFormat = '%Y-%m-%dT%T%z';

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
my $issueURI = uri_unescape( $q->param('issueURI') );
my $title = uri_unescape( $q->param('title') );
my $references = uri_unescape( $q->param('references') );
my $description = uri_unescape( $q->param('description') );
my $creator = uri_unescape( $q->param('creator') );
my $creatorURI = uri_unescape( $q->param('creatorURI') );
my $locationURI = uri_unescape( $q->param('locationURI') );

if ( defined( $q->param('createdDate') ) ){
	my $parser = DateTime::Format::Strptime->new(
		pattern => $dateTimeFormat,
		on_error => 'croak',
	);
	$createdDate = $parser->parse_datetime( uri_unescape( $q->param('createdDate') ) );
}

if ( !defined ( $createdDate ) ){
	$createdDate = DateTime->now();
}


print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/text; charset=UTF-8\n\n";

my $result = {};
$result = addIssue($issueURI, $title, $description, $references, $createdDate, $creator, $creatorURI, $locationURI);
my $js = new JSON;
print $js->pretty->encode( $result );
exit;
# END