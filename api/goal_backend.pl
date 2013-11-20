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
	my $goalURI = $_[0];
	my $parentURI = $_[1];
	my $title = $_[2];
	my $description = $_[3];
	my $desiredDate = $_[4];
	my $requiredDate = $_[5];
	my $creator = $_[6];
	my $createdDate = $_[7];
	my $status = $_[8];
	my $reference = $_[9];
	
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/terms/>        
INSERT INTO <http://collab.open-opinion.org>{ 
<$goalURI> rdf:type socia:Goal.
<$goalURI> dc:title \"$title\". ";

	if ($description){
		$query .= "<$goalURI> dc:description \"$description\".";
	}
	if ($desiredDate){
		$query .= "<$goalURI> socia:desiredTargetDate \"$desiredDate\"^^xsd:date."; 
		#. $desiredDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	if ($requiredDate){
		$query .= "<$goalURI> socia:requiredTargetDate \"$requiredDate\"^^xsd:date.";
		#" . $requiredDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	if ($status){
		$query .= "<$goalURI> socia:status \"$status\".";
	}
	if ($reference){
		$query .= "<$goalURI> dc:reference \"$reference\".";
	}
	if ($creator){
		$query .= "<$goalURI> dc:creator <$creator>.";
	}
	if ($createdDate){
		$query .= "<$goalURI> dc:dateSubmitted \"$createdDate\"^^xsd:date.";
		# . $createdDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	$query .= " }";
	my %res = {};
	$res->{query} = $query;
	$res->{createResult} = execute_sparql( $query );
	
	# Create link between the parent goal and the child goal.
	if ($parentURI){
		linkGoals($parentURI, "http://data.open-opinion.org/socia/data/Goal/$title" );
	}
	return $res;
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



# unlinkGoal(GoalURI, participantURI)
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
	my $res = execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n DELETE FROM <http://collab.open-opinion.org>{<$goalURI> socia:participant <$collaboratorURI>}" );
	return $res;
}

sub getGoalParticipants{
	my $goalURI = $_[0];
	my %result = {};
	$result->{participants} = [];
	$result->{goalURI}= $goalURI;
	my $js = new JSON;
	try{
		my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
		 PREFIX dc: <http://purl.org/dc/terms/>    
		select distinct ?goal ?participant
 where {
    ?goal rdf:type socia:Goal.
    ?goal socia:participant ?participant.
    FILTER ( ?goal = <$goalURI>)}";
		
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		
		

		# Loop all goals and do group by
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			# Add new goal
			#print "adding new goal\n";
			%tmp = {};
			$tmp->{personURI} = $tmpResult->{results}->{bindings}[$i]->{participant}{value};
			$tmp->{personImageURI} = "image/nobody.png";
			$tmp->{personName} = "Teppo";
			
			push(@{$result->{participants}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}




# Issues
#function addIssue(issueURI, title, description, references, createdTime, creator){
# createGoal(parentGoalURI, childGoalURI)\"2013-10-01T00:00:00-09:00\"^^xsd:dateTime
sub addIssue{
	my $issueURI = $_[0];
	my $title = $_[1];
	my $description = $_[2];
	my $references = $_[3];
	my $createdDate = $_[4];
	my $creator = $_[5];
	my $creatorURI = $_[6];
	my $creatorImageURI = $_[7];
	#http://data.open-opinion.org/socia/data/Issue/
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/terms/>        
INSERT INTO <http://collab.open-opinion.org>{ 
<$issueURI> rdf:type socia:Issue.
<$issueURI> dc:title \"$title\". ";
	
	if ($description){
		$query .= "<$issueURI> dc:description \"$description\".";
	}
	
	if ($creatorURI){
		$query .= "<$issueURI> dc:creator <$creatorURI>.";
	}
	
	if ($createdDate){
		$query .= "<$issueURI> dc:dateSubmitted \"$createdDate\"^^xsd:date.";
		# . $createdDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	$query .= " }";
	my $res = {};
	$res->{query} = $query;
	$res->{createRespose} = execute_sparql( $query );
	
	# Create link between issue and references
	if ($references){
		my @parts = split(';', $references);
		# Loop all references
		for ( $i = 0; $i < scalar @parts; $i++ ){
			# Add new goal
			addIssueReference($issueURI, $parts[$i]);
		}
	}
	return $res;
}

sub addIssueReference{
	my $issueURI = $_[0];
	my $referenceURI = $_[1];
	my %result = {};
	$result->{issueURI}= $issueURI;
	$result->{result} = "ok";
	my $js = new JSON;
	
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX dc: <http://purl.org/dc/terms/>    
	INSERT INTO  <http://collab.open-opinion.org>{<$issueURI> dc:references <$referenceURI>}";
	execute_sparql( $query );	
	#print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

sub removeIssueReference{
	my $issueURI = $_[0];
	my $referenceURI = $_[1];
	my %result = {};
	$result->{issueURI}= $issueURI;
	$result->{result} = "ok";
	my $js = new JSON;
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX dc: <http://purl.org/dc/terms/>    
	 DELETE FROM  <http://collab.open-opinion.org>{<$issueURI> dc:references <$referenceURI>}";
	execute_sparql( $query );	
	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

sub clearIssueReferences{
	my $issueURI = $_[0];
	my %result = {};
	$result->{issueURI}= $issueURI;
	$result->{result} = "ok";
	my $js = new JSON;
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX dc: <http://purl.org/dc/terms/>    
	 DELETE FROM  <http://collab.open-opinion.org>{<$issueURI> dc:references <$referenceURI>}";
	execute_sparql( $query );	
	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

sub getIssueReferences{
	my $issueURI = $_[0];
	my %result = {};
	$result->{references} = [];
	$result->{issueURI}= $issueURI;
	my $js = new JSON;	
	try{
		my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
		 PREFIX dc: <http://purl.org/dc/terms/>    
		select distinct ?issue ?reference
 where {
    ?issue rdf:type socia:Issue.
    ?issue dc:references ?reference.
    FILTER ( ?issue = <$issueURI>)}";
		
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		
		

		# Loop all goals and do group by
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			# Add new goal
			#print "adding new goal\n";
			%tmp = {};
			$tmp->{reference} = $tmpResult->{results}->{bindings}[$i]->{reference}{value};
			#$tmp->{personImageURI} = "image/nobody.png";
			push(@{$result->{references}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}


sub addIssueSollution{
	my $issueURI = $_[0];
	my $goalURI = $_[1];
	my %result = {};
	$result->{issueURI}= $issueURI;
	$result->{result} = "ok";
	my $js = new JSON;
	
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX dc: <http://purl.org/dc/terms/>    
	INSERT INTO  <http://collab.open-opinion.org>{<$issueURI> socia:sollution <$goalURI>}";
	$result->{query} = $query;
	$result->{response} = execute_sparql( $query );	
	print $js->pretty->encode($result);
	#return $result;
}

sub removeIssueSollution{
	my $issueURI = $_[0];
	my $goalURI = $_[1];
	my %result = {};
	$result->{issueURI}= $issueURI;
	$result->{result} = "ok";
	my $js = new JSON;
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX dc: <http://purl.org/dc/terms/>    
	 DELETE FROM  <http://collab.open-opinion.org>{<$issueURI> socia:sollution <$goalURI>}";
	$result->{query} = $query;
	execute_sparql( $query );	
	print $js->pretty->encode($result);
	
	#return $result;
}

sub getIssueSollutions{
	my $issueURI = $_[0];
	my %result = {};
	#$result->{references} = [];
	$result->{issueURI}= $issueURI;
	my $js = new JSON;	
	try{
		my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
		 PREFIX dc: <http://purl.org/dc/terms/>    
		select distinct *
 where {
    ?issue rdf:type socia:Issue.
    ?issue socia:sollution ?sollution.
    GRAPH <http://collab.open-opinion.org>{
		?sollution dc:title ?goalTitle.
		OPTIONAL { ?sollution dc:description ?description.      }
		OPTIONAL { ?sollution dc:dateSubmitted ?submittedDate }
		OPTIONAL { ?sollution socia:requiredTargetDate ?requiredTargetDate }
		OPTIONAL { ?sollution socia:desiredTargetDate ?desiredTargetDate }
		OPTIONAL { ?sollution socia:completedDate ?completedDate }
		OPTIONAL { ?sollution socia:status ?status    }
		OPTIONAL { ?sollution dc:creator ?creator }
	}
    FILTER ( ?issue = <$issueURI>)}";
		
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		
		

		# Loop all goals and do group by
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			# Add new goal
			#print "adding new goal\n";
			%tmp = {};
			$tmp->{goalURI} = $tmpResult->{results}->{bindings}[$i]->{sollution}{value};
			$tmp->{title} = $tmpResult->{results}->{bindings}[$i]->{goalTitle}{value};
			$tmp->{description} = $tmpResult->{results}->{bindings}[$i]->{description}{value};
			$tmp->{submittedDate} = $tmpResult->{results}->{bindings}[$i]->{submittedDate}{value};
			$tmp->{requiredTargetDate} = $tmpResult->{results}->{bindings}[$i]->{requiredTargetDate}{value};
			$tmp->{desiredTargetDate} = $tmpResult->{results}->{bindings}[$i]->{desiredTargetDate}{value};
			$tmp->{completedDate} = $tmpResult->{results}->{bindings}[$i]->{completedDate}{value};
			$tmp->{status} = $tmpResult->{results}->{bindings}[$i]->{status}{value};
			$tmp->{creator} = $tmpResult->{results}->{bindings}[$i]->{creator}{value};
			
			#$tmp->{personImageURI} = "image/nobody.png";
			push(@{$result->{sollutions}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}