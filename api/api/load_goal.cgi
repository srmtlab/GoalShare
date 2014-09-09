#!/usr/bin/perl

require "conf.pl";

my $referrer     = 'http://masala.ics.nitech.ac.jp/';

my $q = CGI->new;
my @params = $q->param();

my $wisher = uri_unescape($q->param('wisher'));
utf8::decode($wisher);
my $statuses = uri_unescape($q->param('status'));
utf8::decode($statuses);
my $sort_prop = uri_unescape($q->param('sort_prop'));
if ($sort_prop =~ /^http/) {
    $sort_prop = "<$sort_prop>";
}


print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";


my $sparql = $SPARQL_PREFIX .
    "SELECT * WHERE { GRAPH <${LOD_GRAPH_BASE}Goal> {\n".
    "  ?goal socia:wisher <$wisher>;\n".
    "        socia:status ?status;\n".
    "        $sort_prop ?sortParam;\n".
    "        ?p ?o\n";
#    "        dc:title ?title;\n".
#    "        socia:targetDate ?targetDate;\n".
#    "        dc:description ?desc;\n".
#    "        socia:tag ?tag;\n".
#    "        socia:preparation ?prep;\n".
#    "        socia:subGoal ?subGoal;\n".
#    "        socia:targetDate ?targetDate;\n";
if ($statuses) {
    $sparql .= "FILTER regex(str(?status),\"$statuses\")";
}
$sparql .= ".}} ORDER BY DESC(?sortParam) LIMIT 500\n";

#debug_msg("$sparql\n---\n");

my $qurl = "${QUERY_URL}?query=" . uri_escape_utf8($sparql) . "&output=xml";
my $xml_l = get_content($qurl);
my $doc_l = XML::LibXML->new->parse_string($xml_l);
my @results = $doc_l->getElementsByTagName('result');

#debug_msg("$xml_l\n----\n");

#debug_msg("qurl: $qurl\n---\n");
#debug_msg("results.length: ".@results);

my %goals = (), %hash_to_sort = ();
foreach my $result ( @results ){
    my @bindings = $result->getElementsByTagName('binding');
    my $goal_id, $property;
    foreach my $binding (@bindings) {
	my $name = $binding->getAttribute('name');
	if ($name eq "goal") {
	    $goal_id = trim($binding->textContent);
	    $goals{$goal_id}->{"goal_id"} = $goal_id;
	    if (! $goals{$goal_id}->{"tags"}) {
		$goals{$goal_id}->{"tags"} = [];
	    }
	    if (! $goals{$goal_id}->{"preps"}) {
		$goals{$goal_id}->{"preps"} = [];
	    }
	    if (! $goals{$goal_id}->{"subgoals"}) {
		$goals{$goal_id}->{"subgoals"} = [];
	    }
	} elsif ($name eq "sortParam") {
	    $hash_to_sort{$goal_id} = trim($binding->textContent);
        } elsif ($name eq "p") {
	    $property = trim($binding->textContent);
	} elsif ($name eq "o") {
	    if ($property =~ /title$/) {
	        $goals{$goal_id}->{"title"} = trim($binding->textContent);
	    } elsif ($property =~ /description$/) {
	        $goals{$goal_id}->{"desc"} = trim($binding->textContent);
	    } elsif ($property =~ /status$/) {
	        $goals{$goal_id}->{"status"} = trim($binding->textContent);
	    } elsif ($property =~ /progress$/) {
	        $goals{$goal_id}->{"progress"} = trim($binding->textContent);
	    } elsif ($property =~ /targetDate$/) {
	        $goals{$goal_id}->{"targetDate"} = trim($binding->textContent);
	    } elsif ($property =~ /dateSubmitted$/) {
	        $goals{$goal_id}->{"dateSubmitted"} = trim($binding->textContent);
	    } elsif ($property =~ /dateAccepted$/) {
	        $goals{$goal_id}->{"dateAccepted"} = trim($binding->textContent);
	    } elsif ($property =~ /tag$/) {
		my $ref = $goals{$goal_id}->{"tags"};
		push(@$ref, trim($binding->textContent));
	    } elsif ($property =~ /preparation$/) {
		my $ref = $goals{$goal_id}->{"preps"};
		push(@$ref, trim($binding->textContent));
	    } elsif ($property =~ /subGoal$/) {
		my $ref = $goals{$goal_id}->{"subgoals"};
		push(@$ref, trim($binding->textContent));
	    }
	}
    }
}

my @sorted = sort {$hash_to_sort{$b} cmp $hash_to_sort{$a}} (keys(%hash_to_sort));

my $ret = [];
my $i = 0;
foreach $goal_id (@sorted) {
    my $ref = $goals{$goal_id};
    $ret->[$i++] = $ref;
}

my $json = JSON->new->encode($ret);
print $json;

#debug_msg("ret.length: ".@$ret);

########
## エンティティ一覧の更新とイベントの期間の更新が必要


exit;



########################################


