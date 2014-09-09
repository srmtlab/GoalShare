#!/usr/bin/perl

use Time::Local;

require "conf.pl";

my $referrer     = 'http://masala.ics.nitech.ac.jp/';

my $q = CGI->new;
my @params = $q->param();

my $goal_id = uri_unescape($q->param('goal_id'));
my $title = uri_unescape($q->param("title")); 
my $desc = uri_unescape($q->param('desc'));
my $tags = uri_unescape($q->param('tags'));
my $wisher = uri_unescape($q->param('wisher'));
my $status = uri_unescape($q->param('status'));
my $progress = uri_unescape($q->param('progress'));
my $preps = uri_unescape($q->param('preps'));
my $subgoals = uri_unescape($q->param('subgoals'));
my $targetDate = uri_unescape($q->param('targetDate'));
my $timesSpent = uri_unescape($q->param('timeSpent'));

my @tagarr = split(/\+/, $tags);
my @preparr = split(/\+/, $preps);
my @subarr = split(/\+/, $subgoals);
my @timespentarr = split(/\+/, $timesSpent);

my $first_submit = 0;

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";

if ($goal_id !~ /^http:\/\//) {
    if ($goal_id =~ /^goal/) {
        $goal_id = "${LOD_GRAPH_BASE}Goal/$goal_id";
    } else {
	$first_submit = 1;
	$goal_id = "${LOD_GRAPH_BASE}Goal/goal".get_millisec()."_".$goal_id;
    }
}

my $current = current_date_time();

for (my $i = 0; $i < 3 && ! $current; $i++) {
    $current = current_date_time();
}


my $sparql = $SPARQL_PREFIX .
    "DELETE WHERE { GRAPH <${LOD_GRAPH_BASE}Goal> {\n".
    "  <$goal_id> ?p ?o.".
    "}}\n" .
    "INSERT DATA { GRAPH <${LOD_GRAPH_BASE}Goal> {\n".
    "  <$goal_id> dc:title '''$title''';\n".
    "    dc:description '''$desc''';\n".
    "    socia:status <$status>;\n".
    "    socia:progress \"$progress\"^^xsd:decimal;\n".
    "    socia:targetDate \"$targetDate\"^^xsd:dateTime;\n".
    "    socia:wisher <$wisher>;\n".
    "    dc:modified \"$current\"^^xsd:dateTime;\n";


my $submitted = get_property($goal_id, "socia:dateSubmitted");

if (! $submitted) {
    $submitted = $current;
}
$sparql .= "  dc:dateSubmitted \"$submitted\"^^xsd:dateTime;\n";


my $previous_status = get_property($goal_id, "socia:status");
my $done_tag = "${SOCIA_TAG}Done";

if ($status eq $done_tag) {
    my $accepted = get_property($goal_id, "dc:dateAccepted");
    if (! $accepted) {
	$accepted = $current;
    }
    $sparql .= "  dc:dateAccepted \"$accepted\"^^xsd:dateTime;\n";
}

foreach $tag_id (@tagarr) {
    $sparql .= "  socia:tag <$tag_id>;\n";
}
foreach $prep (@preparr) {
    if ($prep =~ /^http:\/\//) {
	$sparql .= "  socia:preparation <$prep>;\n";
    }
}
foreach $subGoal (@subarr) {
    if ($subGoal =~ /^http:\/\//) {
        $sparql .= "  socia:subGoal <$subGoal>;\n";
    }
}

my $time_spent_sparql = "";
foreach $time_spent (@timespentarr) {
    my $time_spent_id = "${LOD_GRAPH_BASE}Goal/$time_spent";
    my @tokens = split(/,/, $time_spent);
    
    if (@tokens == 2) {
	$sparql .= "  socia:timeSpent <$time_spent_id>;\n";
        $time_spent_sparql +=  "<$time_spent_id> rdf:type dc:PeriodOfTime;\n" .
	    " socia:start \"$tokens[0]\"^^xsd:dateTime;\n". 
	    " socia:end \"$tokens[1]\"^^xsd:dateTime.\n";
    }
}

$sparql .= ".\n$time_spent_sparql\n";
$sparql .= "}}";

debug_msg("sparql: $sparql\n---\n");

my $result = up_content($UPDATE_URL, $sparql);

if( $result !~ /success/im ){
    $goal_id = "null";
}

my %root = ('goal_id' => $goal_id,
  'title' => $title, 'desc' => $desc, 'targetDate' => $targetDate,
  'dateSubmitted' => $submitted, 'modified' => $current,
  'wisher' => $wisher, 'status' => $status, 'progress' => $progress,
  'tags' => \@tags, 'preps' => \@preps, 'subgoals' => \@subgoals
);
if ($status eq $done_tag) {
    $root{'dateAccepted'} = get_property($goal_id, "dc:dateAccepted");
    if (! $root{'dateAccepted'}) {
	$root{'dateAccepted'} = $current;
    }
}
my $hsah_ref = \%root;
my $json_out = JSON->new->encode($hsah_ref);
print $json_out;

debug_msg("json: $json_out\n---\n");

########
## エンティティ一覧の更新とイベントの期間の更新が必要


exit;



########################################


