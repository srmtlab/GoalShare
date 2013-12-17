sub BuildGoalTree{
	#Fetch root node
	my $workURI = getGoalTree($_[0]);
	my @resultArray = ();
	my $index = 0;
	my $resultString = "";
	my $first = 1;
	my $rootNode = ();
	my $currentNode = \$rootNode;
	
	while ( $workURI ){
		
		
		try{
			if( $first == 1 ){
				$rootNode = getNode($workURI);
				$first = 0;
			}else{
				#$tmpNode = $pathPoint->{child}
			}
			
		} catch {
			# Error ocurrend, end building the path
			#$workURI = False;
		}
	}
		
	my $stack_temp = $top;
	
	$loop = 0;	
	while(scalar(@stack)>0 && $loop < 10){
		
		$loop += 1;
		my $tmpElement = pop(@stack);
		 
		$stack_temp->{child} = ();
		$stack_temp->{child}->{title} = $tmpElement->{title}; 
		$stack_temp->{child}->{URI} = $tmpElement->{URI};
		$stack_temp->{child}->{index} = $tmpElement->{index};
		$stack_temp = \%tmpElement;
		
	}
	
	#print %{$top};
	#print $resultString
	#return $resultString;
	return $top;
	#return @resultArray;
}
