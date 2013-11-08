#!/usr/bin/perl

# Api for querying goals

# INPUT parameters:
# num - limits the number of results. Default 1000
# startTime - The beginning of the timerange. Defaults to one day
# endTime - The end of the time range. Defaults to current date.
# [onlyTopGoals] - Optional argument for getting only top goals. Default false. 
# datetime format = "2013-09-10T23:00:14+09:00"

#

#my $dateTimeFormat = '%Y.%m.%dT%T%O';
#my $dateTimeFormat = '%Y.%m.%dT%T';#TODO Add timezone handling
my $dateTimeFormat = '%Y-%m-%dT%T%z';
#TODO Add timezone handling

# OUTPUT
# TODO: Output JSONP
# Format: JSON 
# title
# goalPath - string representation of the path from top goal to the current goal
# creator
# dateTime
# subGoal - list of subgoal urls

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;

require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# getGoaldByURI(goalURI);
sub getGoalByURI{
	my $goalURI = $_[0];
	$tmp = {};
	try{
		my $query = "select distinct ?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status (COUNT(?subg) AS ?CntSubGoals)
	 where {
	    ?goal rdf:type socia:Goal;
	       dc:title ?title.
	       OPTIONAL { ?goal dc:description ?desc.      }
	       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
	       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
	       OPTIONAL { ?goal socia:requiredTargetDate ?requiredTargetDate }
	       OPTIONAL { ?goal socia:desiredTargetDate ?desiredTargetDate }
	       OPTIONAL { ?goal socia:completedDate ?completedDate }
	       OPTIONAL { ?goal socia:status ?status    }
	       OPTIONAL { ?goal dc:creator ?creator
	               #GRAPH <http://collab.open-opinion.org>{
	                 #     ?creator dc:title ?subGoalTitle.
	                #}
	       }
	       OPTIONAL { ?goal socia:subGoal  ?subg.} \n
	 	   FILTER (?goal = <$goalURI>)
	 } GROUP BY ?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status";
	
		my $result_json = execute_sparql( $query );
	
		my $tmpResult = decode_json $result_json;
		
		
		$tmp->{cntSubGoals} = $tmpResult->{results}->{bindings}[0]->{cntSubGoals}{value};
		#$tmp->{wishers} = [];
		$tmp->{url} = $tmpResult->{results}->{bindings}[0]->{goal}{value};
		$tmp->{title} = $tmpResult->{results}->{bindings}[0]->{title}{value};
		$tmp->{requiredTargetDate} = $tmpResult->{results}->{bindings}[0]->{requiredTargetDate}{value};
		$tmp->{desiredTargetDate} = $tmpResult->{results}->{bindings}[0]->{desiredTargetDate}{value};
		$tmp->{completedDate} = $tmpResult->{results}->{bindings}[0]->{completedDate}{value};
		$tmp->{status} = $tmpResult->{results}->{bindings}[0]->{status}{value};
		$tmp->{creator} = $tmpResult->{results}->{bindings}[0]->{creator}{value};
		$tmp->{creatorUrl} = "http://test.com";#TODO Get url
		#$$tmp->{path} = [];
		$tmp->{dateTime} = $tmpResult->{results}->{bindings}[0]->{submDate}{value};
	}
	catch
	{
		return $tmp;
	}
}

# parentGoalURI, title, desiredDate,requiredDate,  creator, createdDate, status, reference
# createGoal(parentGoalURI, childGoalURI)\"2013-10-01T00:00:00-09:00\"^^xsd:dateTime
sub createGoal{
	my $parentURI = $_[0];
	my $title = $_[1];
	my $description = $_[2];
	my $desiredDate = $_[3];
	my $requiredDate = $_[4];
	my $creator = $_[5];
	my $createdDate = $_[6];
	my $status = $_[7];
	my $reference = $_[8];
	
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/terms/>        
INSERT INTO <http://collab.open-opinion.org>{ 
<http://data.open-opinion.org/socia/data/Goal/$title> rdf:type socia:Goal.
<http://data.open-opinion.org/socia/data/Goal/$title> dc:title \"$title\". ";

	if ($desiredDate){
		$query .= "<http://data.open-opinion.org/socia/data/Goal/$title> socia:desiredTargetDate \"$desiredDate\"^^xsd:date."; 
		#. $desiredDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	if ($requiredDate){
		$query .= "<http://data.open-opinion.org/socia/data/Goal/$title> socia:requiredTargetDate \"$requiredDate\"^^xsd:date.";
		#" . $requiredDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	if ($status){
		$query .= "<http://data.open-opinion.org/socia/data/Goal/$title> socia:status \"$status\".";
	}
	if ($reference){
		$query .= "<http://data.open-opinion.org/socia/data/Goal/$title> dc:reference \"$reference\".";
	}
	if ($creator){
		$query .= "<http://data.open-opinion.org/socia/data/Goal/$title> dc:creator <$creator>.";
	}
	if ($createdDate){
		$query .= "<http://data.open-opinion.org/socia/data/Goal/$title> dc:created \"$createdDate\"^^xsd:date.";
		# . $createdDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	$query .= " }";
	execute_sparql( $query );
	
	# Create link between the parent goal and the child goal.
	if ($parentURI){
		linkGoals($parentURI, "http://data.open-opinion.org/socia/data/Goal/$title" );
	}
	return;
}

# linkGoal(parentGoalURI, childGoalURI)
sub linkGoals{
	my $parentURI = $_[0];
	my $childURI = $_[1];
	#link Child->parent
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n INSERT INTO  <http://collab.open-opinion.org>{<$parentURI> socia:subGoal <$childURI>}" );
	#link Parent->child
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n  INSERT INTO <http://collab.open-opinion.org>{<$childURI> socia:subGoalOf <$parentURI>}" );
}


# unlinkGoal(parentGoalURI, childGoalURI)
sub unlinkGoals{
	my $parentURI = $_[0];
	my $childURI = $_[1];
	#unlink Child->parent
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n  DELETE FROM <http://collab.open-opinion.org>{<$parentURI> socia:subGoal <$childURI>}" );
	#unlink Parent->child
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n  DELETE FROM <http://collab.open-opinion.org>{<$childURI> socia:subGoalOf <$parentURI>}" );
}



# unlinkGoal(parentGoalURI, childGoalURI)
sub addGoalParticipant{
	my $goalURI = $_[0];
	my $collaboratorURI = $_[1];
	#Create link
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n INSERT INTO  <http://collab.open-opinion.org>{<$goalURI> socia:participant <$collaboratorURI>}" );
}
# unlinkGoal(parentGoalURI, childGoalURI)
sub removeGoalParticipant{
	my $goalURI = $_[0];
	my $collaboratorURI = $_[1];
	#Create link
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n DELETE FROM <http://collab.open-opinion.org>{<$goalURI> socia:participant <$collaboratorURI>}" );
}

sub getGoalparticipants{
	my $goalURI = $_[0];
	$tmp = {};
	try{
		my $query = "select distinct ?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status (COUNT(?subg) AS ?CntSubGoals)
	 where {
	    ?goal rdf:type socia:Goal;
	       dc:title ?title.
	       OPTIONAL { ?goal dc:description ?desc.      }
	       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
	       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
	       OPTIONAL { ?goal socia:requiredTargetDate ?requiredTargetDate }
	       OPTIONAL { ?goal socia:desiredTargetDate ?desiredTargetDate }
	       OPTIONAL { ?goal socia:completedDate ?completedDate }
	       OPTIONAL { ?goal socia:status ?status    }
	       OPTIONAL { ?goal dc:creator ?creator
	               #GRAPH <http://collab.open-opinion.org>{
	                 #     ?creator dc:title ?subGoalTitle.
	                #}
	       }
	       OPTIONAL { ?goal socia:subGoal  ?subg.} \n
	 	   FILTER (?goal = <$goalURI>)
	 } GROUP BY ?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status";
	
		my $result_json = execute_sparql( $query );
	
		my $tmpResult = decode_json $result_json;
		
		
		$tmp->{cntSubGoals} = $tmpResult->{results}->{bindings}[0]->{cntSubGoals}{value};
		#$tmp->{wishers} = [];
		$tmp->{url} = $tmpResult->{results}->{bindings}[0]->{goal}{value};
		$tmp->{title} = $tmpResult->{results}->{bindings}[0]->{title}{value};
		$tmp->{requiredTargetDate} = $tmpResult->{results}->{bindings}[0]->{requiredTargetDate}{value};
		$tmp->{desiredTargetDate} = $tmpResult->{results}->{bindings}[0]->{desiredTargetDate}{value};
		$tmp->{completedDate} = $tmpResult->{results}->{bindings}[0]->{completedDate}{value};
		$tmp->{status} = $tmpResult->{results}->{bindings}[0]->{status}{value};
		$tmp->{creator} = $tmpResult->{results}->{bindings}[0]->{creator}{value};
		$tmp->{creatorUrl} = "http://test.com";#TODO Get url
		#$$tmp->{path} = [];
		$tmp->{dateTime} = $tmpResult->{results}->{bindings}[0]->{submDate}{value};
	}
	catch
	{
		return $tmp;
	}
}

	