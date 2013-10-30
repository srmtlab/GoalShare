#!/usr/bin/perl 

require("sparql.pl");


$graph_uri = "http://collab.open-opinion.org";

$SPARQL_PREFIX .= "PREFIX socia-goal: <http://data.open-opinion.org/socia/data/Goal/>\n";

#my $goal = "socia-goal:移動先から支援地へ帰還するための学習支援を行う";
#my $goal = "socia-goal:南相馬市小高、原町両区の旧警戒区域にある県、市所有の７つの農業用排水機場を直轄事業で復旧させる";
#my $goal = "socia-goal:農業用排水機場の早期復旧";
my $goal = "http://data.open-opinion.org/socia/data/Goal/福島第一原発廃炉";
my @paths = get_goal_paths($goal);

foreach $path (@paths) {
    for (my $i = 0; $i < @$path; $i++) {
	my $uri2title = $path->[$i];
	my $title = encode('utf-8', $uri2title->{"title"});
	if ($i > 0) {
	    print " > ";
	}
	print $title;
    }
    print "\n";
}


sub get_goal_paths {
    my $goal_uri = $_[0];
    if (! $goal_uri) {
	return ();
    } elsif ($goal_uri =~ /^http:/) {
	$goal_uri = "<$goal_uri>";
    }

    my $sparql = $SPARQL_PREFIX .
	"select ?title { $goal_uri dc:title ?title.}";
    my @bindings = get_bindings($sparql, $graph_uri);
    my $title = $bindings[0]->[0]->{"title"}->{"value"};

    my @paths = (), @title_paths = ();
    do {
	my @super_goals = get_super_goals($goal_uri);
	foreach $super_goal (@super_goals) {
	    print "@@@ [super_goal] $super_goal\n";	    
	    my $super_title = encode('utf-8', $uri2title{$super_goal});
	    $super_goal = encode('utf-8', $super_goal);
	    my @paths_super = get_goal_paths($super_goal);
	    my $thisgoal = {"uri" => $goal_uri, "title" => $title};
	    foreach $path (@paths_super) {
		push(@$path, $thisgoal);
		push(@paths, $path);
	    }
	    if (! @paths) {
		my $path = [ $thisgoal ];
		push(@paths, $path);
	    }
	}
    } while (@super_goals);
    return @paths;

}


sub get_super_goals {
    my $goal_uri = $_[0];
    if (! $goal_uri) {
	return ();
    } elsif ($goal_uri =~ /^http:/) {
	$goal_uri = "<$goal_uri>";
    }
    
    my $sparql = $SPARQL_PREFIX .
	"select ?supergoal ?title { ?supergoal socia:subGoal $goal_uri; dc:title ?title.}";
    #print "[SPARQL] $sparql\n\n";
    my @bindings = get_bindings($sparql, $graph_uri);
    my %flag = ();
    foreach $binding (@bindings) {
	my $supergoal = $binding->[0]->{"supergoal"}->{"value"};
	$flag{$supergoal} = 1;
	#print ";;;; $supergoal\n";
    }
    return keys(%flag);
}
