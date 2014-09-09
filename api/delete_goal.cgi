#!/usr/bin/perl
v

require "conf.pl";

my $referrer     = 'http://masala.ics.nitech.ac.jp/';

my $q = CGI->new;
my @params = $q->param();

my $goal_id = uri_unescape($q->param('goal_id'));

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";



my $sparql = $SPARQL_PREFIX .
    "DELETE WHERE { GRAPH <${LOD_GRAPH_BASE}Goal> {\n".
    "  <$goal_id> ?p ?o. }}\n";

#debug_msg("$sparql\n---\n");

my $result = up_content($UPDATE_URL, $sparql);

if( $result !~ /success/im ){
    $goal_id = "null";
}

my %root = ('goal_id' => $goal_id);
my $hsah_ref = \%root;
my $json_out = JSON->new->encode($hsah_ref);
print "$json_out";



########
## エンティティ一覧の更新とイベントの期間の更新が必要


exit;



########################################


