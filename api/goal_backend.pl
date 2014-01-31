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
require("debug_log.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

my $prefix = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>';

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
		logRequest('Goal', 'getGoalByURI','fetch',$query,$result_json);
		
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
	my $locationURI = $_[10];
	my $goalWisherURI = $_[11];
	my $relatedList = $_[12];
	
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/terms/>        
INSERT INTO <http://collab.open-opinion.org>{ 
<$goalURI> rdf:type socia:Goal.
<$goalURI> dc:title '''$title'''. ";

	if ($description){
		$query .= "<$goalURI> dc:description '''$description'''.";
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
		$query .= "<$goalURI> dc:dateSubmitted \"$createdDate\"^^xsd:dateTime.";
		# 2013-12-10T15:22:40+09:00
		# . $createdDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	if ($locationURI){
		$query .= "<$goalURI> dc:spatial <$locationURI>.";
	}
	if ($goalWisherURI){
		$query .= "<$goalURI> socia:wisher <$goalWisherURI>.";
	}
	if ($parentURI){
		#$query .= "<$goalURI> socia:subGoalOf <$parentURI>.";
	}
	if ( defined($debugFlag) ){
		$query .= "<$goalURI> socia:isDebug (true).";
	}
	
	$query .= " }";
	my %res = {};
	$res->{query} = $query;
	$res->{params}->{goalURI} = $goalURI;
	$res->{params}->{parentGoalURI} = $parentURI;
	$res->{params}->{title} = $title;
	$res->{params}->{reference} = $reference;
	$res->{params}->{creator} = $creator;
	$res->{params}->{status} = $status;
	$res->{params}->{description} = $description;
	$res->{params}->{locationURI} = $locationURI;
	$res->{params}->{goalWisherURI} = $goalWisherURI;
	
	$res->{createResult} = execute_sparql( $query );
	logRequest('Goal', 'createGoal','Insert',$query,$res->{createResult});
	# Create link between the parent goal and the child goal.
	if ($parentURI){
		linkGoals( $parentURI, $goalURI );
	}
	# Create link between issue and references
	if ( $relatedList ){
		my @parts = split(';', $relatedList);
		# Loop all references
		for ( $i = 0; $i < scalar @parts; $i++ ){
			# Add new related
			addGoalRelated($goalURI, $parts[$i]);
		}
	}
	#Start the goal similarity calculation process
	calculateSimilarGoals($goalURI);
	return $res;
}
sub deleteGoal{
	my $deleteGoalURI = $_[0];
	my $delete = $_[1];

	my $query = "
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
with <http://collab.open-opinion.org>
DELETE { ?goal ?p ?v. }
WHERE {
?goal rdf:type socia:Goal.
FILTER (?goal = <$deleteGoalURI>)
FILTER (?p = dc:title || ?p = dc:description || ?p = socia:desiredTargetDate || ?p = socia:requiredTargetDate 
		|| ?p = socia:status || ?p = dc:reference || ?p = dc:creator || ?p = dc:dateSubmitted || ?p = dc:spatial 
		|| ?p = socia:wisher || ?p = socia:isDebug )
?goal ?p ?v
}";
my $res = {};

$res->{query} = $query;
$res->{createResult} = execute_sparul( $query );
logRequest('Goal', 'deleteGoal','Delete',$query,$res->{createResult});
print( (new JSON)->pretty->encode($res));
return $res;
}

# linkGoal(parentGoalURI, childGoalURI)
sub linkGoals{
	my $parentURI = $_[0];
	my $childURI = $_[1];
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n INSERT INTO  <http://collab.open-opinion.org>{<$parentURI> socia:subGoal <$childURI>}";
	#link Child->parent
	my $res = execute_sparql( $query );
	logRequest('Goal-Link', 'Link[C->P]', 'Insert', $query, $res);
	$res = "";
	#link Parent->child
	$query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n  INSERT INTO <http://collab.open-opinion.org>{<$childURI> socia:subGoalOf <$parentURI>}";
	$res = execute_sparql( $query );
	logRequest('Goal-Link', 'Ling[p->c]', 'Insert', $query, $res);
}


# unlinkGoal(parentGoalURI, childGoalURI)
sub unlinkGoals{
	my $parentURI = $_[0];
	my $childURI = $_[1];
	#unlink Child->parent
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n  DELETE FROM <http://collab.open-opinion.org>{<$parentURI> socia:subGoal <$childURI>}"; 
	my $res = execute_sparql( $query );
	logRequest('Goal-Link', 'Unlink[C->P]','Delete',$query,$res);
	$res = "";
	#unlink Parent->child
	$query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n  DELETE FROM <http://collab.open-opinion.org>{<$childURI> socia:subGoalOf <$parentURI>}"; 
	$res = execute_sparql( $query );
	logRequest('Goal-Link', 'Unlink[P->C]','Delete',$query,$res);
}




sub addGoalParticipant{
	my $goalURI = $_[0];
	my $collaboratorURI = $_[1];
	$result->{command}= "create";
	$result->{goalURI}= $goalURI;
	$result->{collaboratorURI}= $collaboratorURI;
	#Create link
	execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n INSERT INTO  <http://collab.open-opinion.org>{<$goalURI> socia:participant <$collaboratorURI>}" );
	print( (new JSON)->pretty->encode($result));
}

sub removeGoalParticipant{
	my $goalURI = $_[0];
	my $collaboratorURI = $_[1];
	my %result = {};
	$result->{command}= "delete";
	$result->{goalURI}= $goalURI;
	$result->{collaboratorURI}= $collaboratorURI;
	#Remove link
	my $res = execute_sparql( "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n DELETE FROM <http://collab.open-opinion.org>{<$goalURI> socia:participant <$collaboratorURI>}" );
	print( (new JSON)->pretty->encode($result));
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
		 PREFIX go: <http://ogp.me/ns#>    
		select distinct *
 where {
    ?goal rdf:type socia:Goal.
    ?goal socia:participant ?participant.
    GRAPH<http://collab.open-opinion.org>{
    	?participant foaf:name ?personName.
  		?participant foaf:img ?personImageURI.	
    }
    FILTER ( ?goal = <$goalURI>)}";
		
		$result->{query} = $query;
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		

		# Loop all goals and do group by
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			# Add new goal
			#print "adding new goal\n";
			%tmp = {};
			$tmp->{personURI} = $tmpResult->{results}->{bindings}[$i]->{participant}{value};
			$tmp->{personImageURI} = $tmpResult->{results}->{bindings}[$i]->{personImageURI}{value};
			$tmp->{personFBURI} = $tmpResult->{results}->{bindings}[$i]->{personFBURI}{value}; 
			#"image/nobody.png";#"http://graph.facebook.com/1442800768/picture?type=large"
			$tmp->{personName} = $tmpResult->{results}->{bindings}[$i]->{personName}{value};
			
			push(@{$result->{participants}}, $tmp);
		}
	}
	catch
	{
		print $js->pretty->encode($result);
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}
################################
sub addGoalRelated{
	my $goalURI = $_[0];
	my $referenceURI = $_[1];
	my %result = {};
	$result->{goalURI}= $goalURI;
	$result->{result} = "ok";
	my $js = new JSON;
	logGeneral("Adding goal related [$goalURI] [$referenceURI]");
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX skos: <http://www.w3.org/2004/02/skos/core#>    
	INSERT INTO  <http://collab.open-opinion.org>{<$goalURI> skos:relatedTo <$referenceURI>}";
	execute_sparql( $query );	
	#print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

sub removeGoalRelated{
	my $goalURI = $_[0];
	my $referenceURI = $_[1];
	my %result = {};
	$result->{goalURI}= $goalURI;
	$result->{result} = "ok";
	my $js = new JSON;
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
	 DELETE FROM  <http://collab.open-opinion.org>{<$goalURI> skos:relatedTo <$referenceURI>}";
	execute_sparql( $query );	
	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

sub clearGoalRelated{
	my $goalURI = $_[0];
	my %result = {};
	$result->{goalURI}= $goalURI;
	$result->{result} = "ok";
	my $js = new JSON;
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
	 PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
	 DELETE FROM  <http://collab.open-opinion.org>{<$goalURI> skos:relatedTo <$referenceURI>}";
	execute_sparql( $query );	
	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

sub getGoalRelated{
	my $goalURI = $_[0];
	my %result = {};
	$result->{related} = [];
	$result->{goalURI}= $goalURI;
	my $js = new JSON;	
	try{
		my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
		 PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
		select distinct ?goal ?related
 where {
    ?goal rdf:type socia:Goal.
    ?goal skos:relatedTo ?related.
    FILTER ( ?goal = <$goalURI>)
 }";
		
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		
		

		# Loop all goals and do group by
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			# Add new goal
			#print "adding new goal\n";
			my $tmp = {};
			$tmp->{related} = $tmpResult->{results}->{bindings}[$i]->{related}{value};
			#$tmp->{personImageURI} = "image/nobody.png";
			push(@{$result->{related}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}

# Executes the similarity calculation 
sub calculateSimilarGoals{
	$goalURI = $_[0];
	logGeneral("Starting similarity calc process for [$goalURI]...");
	# If started process stdout is redirected, system-call 
	# returns immediately after starting the child process.
	system("calc_similarity.pl $goalURI > /dev/null");
	logGeneral("Returning to respond...");
}

################################



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
	my $locationURI = $_[7];
	my $wisherURI = $_[8];
	#http://data.open-opinion.org/socia/data/Issue/
	my $query = "PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/terms/>        
INSERT INTO <http://collab.open-opinion.org>{ 
<$issueURI> rdf:type socia:Issue.
<$issueURI> dc:title '''$title'''. ";
	
	if ($description){
		$query .= "<$issueURI> dc:description '''$description'''.";
	}
	
	if ($creatorURI){
		$query .= "<$issueURI> dc:creator <$creatorURI>.";
	}
	
	if ($wisherURI){
		$query .= "<$issueURI> socia:wisher <$wisherURI>.";
	}
	
	if ($createdDate){
		$query .= "<$issueURI> dc:dateSubmitted \"$createdDate\"^^xsd:dateTime.";
		# . $createdDate->strftime("%Y%m%d") . "\"^^xsd:date.";
	}
	
	if ($locationURI){
		$query .= "<$issueURI> dc:spatial <$locationURI>.";
	}
	if ( defined($debugFlag) ){
		logGeneral("Saving debug issue[$issueURI]");
		$query .= "<$issueURI> socia:isDebug (\"true\"^^xsd:boolean).";
	}
	$query .= " }";
	my $res = {};
	$res->{query} = $query;
	$res->{createRespose} = execute_sparql( $query );
	logRequest('Issue', 'addIssue','Insert',$query, $res->{createRespose});
	
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
sub deleteIssue{
	my $deleteIssueURI = $_[0];
	my $delete = $_[1];

	my $query = "
PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
with <http://collab.open-opinion.org>
DELETE { ?issue ?p ?v. }
WHERE {
?issue rdf:type socia:Issue.
FILTER (?issue = <$deleteIssueURI>)
FILTER (?p = socia:wisher || ?p = dc:creator || ?p = dc:description  || ?p = dc:title || ?p = dc:dateSubmitted || ?p = dc:spatial || ?p = dc:references  || ?p = rdf:type)
?issue ?p ?v
}";
my $js = new JSON;
my $res = {};

$res->{query} = $query;
$res->{deleteResult} = execute_sparul( $query );
logRequest('Issue', 'deleteIssue','Delete',$query, $res->{deleteResult});
print $js->pretty->encode($res);
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
			my $tmp = {};
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
			push(@{$result->{solutions}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}



sub addUser{
	my ($userURI, $name, $imageURI, $fbURI) = @_;
	
	my %result = {};
	$result->{userURI}= $userURI;
	$result->{result} = "ok";
	my $js = new JSON;
	
	my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>

INSERT INTO  <http://collab.open-opinion.org>
{
  <$userURI> rdf:type foaf:Person.
  <$userURI> foaf:name '''$name\'''.
  <$userURI> foaf:img <$imageURI>.
  <$userURI> go:url <$fbURI>.

}";
	$result->{query} = $query;
	$result->{response} = execute_sparql( $query );	
	print $js->pretty->encode($result);
	#return $result;
}

sub removeUser{
	my $userURI = $_[0];
	my %result = {};
	$result->{userURI}= $userURI;
	$result->{result} = "ok";
	my $js = new JSON;
	my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>
	 DELETE FROM  <http://collab.open-opinion.org>{<$userURI> dc:type foaf:Person}";
	$result->{query} = $query;
	execute_sparql( $query );	
	print $js->pretty->encode($result);
	
	#return $result;
}
sub getUserByURI{
	my $userURI = $_[0];
	my %result = {};
	$result->{references} = [];
	$result->{userURI}= $userURI;
	my $js = new JSON;	
	try{
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>

select distinct * where 
{
?person rdf:type foaf:Person;
foaf:name ?name;
foaf:img ?imageURI;
go:url ?fbURI.
FILTER(?person = <$userURI>)
} LIMIT 1";
		
		$result->{query} = $query;
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		
		

		%tmp = {};
		$tmp->{personURI} = $tmpResult->{results}->{bindings}[0]->{person}{value};
		$tmp->{imageURI} = $tmpResult->{results}->{bindings}[0]->{imageURI}{value};
		$tmp->{name} = $tmpResult->{results}->{bindings}[0]->{name}{value};
		$tmp->{fbURI} = $tmpResult->{results}->{bindings}[0]->{fbURI}{value};
		#$tmp->{personImageURI} = "image/nobody.png";
		$result->{person} = $tmp;
		
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}
sub getUserByFBURI{
	my $fbURI = $_[0];
	my %result = {};
	$result->{references} = [];
	$result->{fbURI}= $fbURI;
	my $js = new JSON;	
	try{
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>

select distinct * where 
{
?person rdf:type foaf:Person;
foaf:name ?name;
foaf:img ?imageURI;
go:url ?fbURI.
FILTER(?fbURI = <$fbURI>)
} LIMIT 1";
		
		$result->{query} = $query;
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		
		

		%tmp = {};
		$tmp->{personURI} = $tmpResult->{results}->{bindings}[0]->{person}{value};
		$tmp->{imageURI} = $tmpResult->{results}->{bindings}[0]->{imageURI}{value};
		$tmp->{name} = $tmpResult->{results}->{bindings}[0]->{name}{value};
		$tmp->{fbURI} = $tmpResult->{results}->{bindings}[0]->{fbURI}{value};
		#$tmp->{personImageURI} = "image/nobody.png";
		$result->{person} = $tmp;
		
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}
sub getUsers{
	
	my %result = {};
	my $js = new JSON;	
	try{
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
PREFIX socia: <http://data.open-opinion.org/socia-ns#>
PREFIX go: <http://ogp.me/ns#>

select distinct * where 
{
?person rdf:type foaf:Person.
?person foaf:name ?name.
?person foaf:img ?imageURI.
OPTIONAL {?person go:url ?fbURI.}
}";
		
		$result->{query} = $query;
		$result->{users} = [];
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		my $tmp = {};
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			$tmp = {};
			$tmp->{personURI} = $tmpResult->{results}->{bindings}[$i]->{person}{value};
			$tmp->{imageURI} = $tmpResult->{results}->{bindings}[$i]->{imageURI}{value};
			$tmp->{name} = $tmpResult->{results}->{bindings}[$i]->{name}{value};
			$tmp->{fbURI} = $tmpResult->{results}->{bindings}[$i]->{fbURI}{value};
			push(@{$result->{users}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}
sub getUserGoalRelations{
	my $userURI = $_[0];
	my %result = {};
	
	my $js = new JSON;	
	try{
		my $query = $prefix; 
		$query .= " select distinct *
where { 
?goal rdf:type socia:Goal.
OPTIONAL { ?goal dc:title ?title. } 
OPTIONAL { ?goal socia:status ?status    }
OPTIONAL { ?goal dc:spatial ?locationURI }
{
 select ?goal ?user (\"creator\" as ?type){
  ?goal dc:creator ?user.
 }
}UNION
{
 select ?goal ?user (\"wisher\" as ?type){
  ?goal socia:wisher ?user.
 }
}
UNION
{
 select ?goal ?user (\"participant\" as ?type){
  ?goal socia:participant ?user.
 }
} ";

if ( defined( $userURI ) ){
	$query .= "FILTER (?user = <$userURI>)";
}
$query .= " }";
		
		$result->{query} = $query;
		$result->{users} = [];
		my $result_json = execute_sparql( $query );
		my $tmpResult = decode_json $result_json;
		my $tmp = {};
		for ( $i = 0; $i < scalar @{$tmpResult->{'results'}->{'bindings'}}; $i++ ){
			$tmp = {};
			$tmp->{userURI} = $tmpResult->{results}->{bindings}[$i]->{user}{value};
			$tmp->{type} = $tmpResult->{results}->{bindings}[$i]->{type}{value};
			$tmp->{goalURI} = $tmpResult->{results}->{bindings}[$i]->{goal}{value};
			$tmp->{title} = $tmpResult->{results}->{bindings}[$i]->{title}{value};
			$tmp->{status} = $tmpResult->{results}->{bindings}[$i]->{status}{value};
			push(@{$result->{users}}, $tmp);
		}
	}
	catch
	{
	};

	print $js->pretty->encode($result);
	#return $js->pretty->encode($result);
}
# ************************ Goal tree functions *********************************

sub getNode{
	my $goalURI = $_[0];

# Generate Sparql query

# Prefix
my $sparql = 'PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
# Select?goal ?title ?desc ?parentGoal ?submDate ?requiredTargetDate ?desiredTargetDate ?completedDate ?creator ?status  ?parentGoalTitle ?creatorName ?imageURI ?locationURI
$sparql .= 'select distinct *
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
       OPTIONAL { ?goal dc:spatial ?locationURI}
       OPTIONAL { ?goal dc:creator ?creator}       
       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL {
GRAPH <http://collab.open-opinion.org>{
        OPTIONAL {?creator foaf:name ?creatorName.}
        OPTIONAL { ?creator foaf:img ?imageURI. }
        OPTIONAL { ?creator go:url ?fbURI. }
    }
       }
       OPTIONAL { GRAPH <http://collab.open-opinion.org>{?parentGoal dc:title ?parentGoalTitle }}
       
     FILTER ( ?goal = <' . $goalURI . '>)
      } LIMIT 1';

my $result_json = execute_sparql( $sparql );
my $test = decode_json $result_json;
#my %result = {};
#$result->{goal} = [];

	my $tmp = {};
	$tmp->{cntSubGoals} = $test->{results}->{bindings}[0]->{cntSubGoals}{value};
	#$tmp->{wishers} = [];
	$tmp->{goalURI} = $test->{results}->{bindings}[0]->{goal}{value};
	$tmp->{title} = $test->{results}->{bindings}[0]->{title}{value};
	$tmp->{description} = $test->{results}->{bindings}[0]->{desc}{value};
	$tmp->{requiredTargetDate} = $test->{results}->{bindings}[0]->{requiredTargetDate}{value};
	$tmp->{desiredTargetDate} = $test->{results}->{bindings}[0]->{desiredTargetDate}{value};
	$tmp->{completedDate} = $test->{results}->{bindings}[0]->{completedDate}{value};
	$tmp->{status} = $test->{results}->{bindings}[0]->{status}{value};
	$tmp->{creator} = $test->{results}->{bindings}[0]->{creator}{value};
	$tmp->{creatorURI} = $test->{results}->{bindings}[0]->{creator}{value};
	$tmp->{creatorImageURI} = $test->{results}->{bindings}[0]->{imageURI}{value};
	$tmp->{creatorName} = $test->{results}->{bindings}[0]->{creatorName}{value};
	$tmp->{parentGoalURI} = $test->{results}->{bindings}[0]->{parentGoal}{value};
	$tmp->{parentGoalTitle} = $test->{results}->{bindings}[0]->{parentGoalTitle}{value};
	$tmp->{createdDate} = $test->{results}->{bindings}[0]->{submDate}{value};
	$tmp->{dateTime} = $test->{results}->{bindings}[0]->{submDate}{value};
	$tmp->{locationURI} = $test->{results}->{bindings}[0]->{locationURI}{value};
	#push(@{$result->{goals}}, $tmp);
	return $tmp;	
}
# Fetch root node of the goal tree
sub getTreeRoot{
	my $workURI = $_[0];
	
	while ( $workURI ){
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
select distinct ?goal ?title ?parentGoal
 where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal socia:subGoalOf  ?parentGoal }   
       FILTER ( ?goal = <$workURI>)}";
		#logGeneral("[$$] Fetching root, current [$workURI]");
		try{
			my $temp = execute_sparql( $query );
			my $result_json = decode_json($temp);
			if( $result_json->{results}{bindings}[0]->{parentGoal}{value} && $result_json->{results}{bindings}[0]->{parentGoal}{value} ne '' ){
				$workURI = $result_json->{results}{bindings}[0]->{parentGoal}{value};
			}else{
				last;	
			}	
		} catch {
			last;
		}
	}
	return $workURI;
}