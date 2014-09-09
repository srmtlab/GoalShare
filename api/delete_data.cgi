#!/usr/bin/perl 

require("sparql.pl");
my $q = CGI->new;
my @params = $q->param();

my $n3 = uri_unescape($q->param('n3'));
my $graph_uri = uri_unescape($q->param('graph'));

if (! $graph_uri) {
    $graph_uri = "http://collab.open-opinion.org";
}

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";


my $sparql = "DELETE DATA FROM <$graph_uri> {$n3}";
my $result_json = execute_sparul($sparql);

print $result_json;

exit;
