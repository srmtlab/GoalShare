#!/usr/bin/perl
#use strict;
#use warnings;

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;
require("sparql.pl");
require("goal_backend.pl");
require("goaltree_backend.pl");
my $graph_uri = "http://collab.open-opinion.org";
my $q = CGI->new;
my @params = $q->param();

my $goalURI = uri_unescape ( $q->param( 'goalURI' ) );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";


	
my $ttmp = {};
my $rt = getTreeRoot($goalURI);
print $rt;
my $tmp = getNode($rt);
fetchChilds(\%$tmp);
my $js = new JSON;
print $js->pretty->encode( $tmp );

exit;
