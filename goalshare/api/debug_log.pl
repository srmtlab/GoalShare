use DBI;
use Try::Tiny;
use String::Util 'trim';

my $dbUser = "gsuser";
my $dbPassword = "goalshare";
my $dbname = "Goalshare";


sub logRequest{
	my $refer = $_[0];
	my $name = $_[1];
	my $type = $_[2];
	my $request = $_[3];
	my $response = trim($_[4]);
	my $status = $_[5];
	try{
	# Open connection
		my $dbh = DBI->connect(          
		    "dbi:mysql:dbname=$dbname", 
		    "$dbUser",                          
		    $dbPassword,                          
		    { RaiseError => 1 },         
		);
		my $query = 'INSERT INTO RequestLogs(PID, referringTo, RequestName, RequestType, Request, Response)VALUES('.$dbh->quote($$).', "'.$dbh->quote($refer).'", "'.$dbh->quote($name).'", "'.$dbh->quote($type).'", "'.$dbh->quote($request).'", "'.$dbh->quote($response).'");';
		$dbh->do($query);
		
		$dbh->disconnect();
	}catch{
		# Fallback to stderr
		print STDERR "[$$|$refer|$name|$type|$request|$response|]";
		#print $_;
	}
}


sub logHttpRequest{
	
	my $type = $_[0];
	my $request = $_[1];
	my $response = $_[2];
	my $status = $_[3];
	try{
		
	# Open connection
		#INSERT INTO HttpRequestLogs(PID, RequestType, Request, Response, Status)VALUES(123132, 'test', 'aaaaaaaaaa', 'OK');
		
		my $dbh = DBI->connect(          
		    "dbi:mysql:dbname=$dbname", 
		    "$dbUser",                          
		    $dbPassword,                          
		    { RaiseError => 1 },         
		);
		my $query = 'INSERT INTO HttpRequestLogs(PID, RequestType, Request, Response, Status)VALUES('.$$.', "'.$dbh->quote($type).'", "'.$dbh->quote($request).'", "'.$dbh->quote($response).'", "'.$dbh->quote($status).'");';
		$dbh->do($query);
		
		$dbh->disconnect();
	}catch{
		# Fallback to stderr
		#print STDERR "[$$|$refer|$name|$type|$request|$response|]";
		#print $_;
	}
}

sub logGeneral{
	
	my $message = $_[0];
	try{
		
	# Open connection
		my $dbh = DBI->connect(          
		    "dbi:mysql:dbname=$dbname", 
		    "$dbUser",                          
		    $dbPassword,                          
		    { RaiseError => 1 },         
		);
		my $query = 'INSERT INTO GeneralLogs(PID, Message)VALUES('.$$.', "'.$dbh->quote($message).'");';
		$dbh->do($query);
		$dbh->disconnect();
	}catch{
		# Fallback to stderr
		#print STDERR "[$$|$refer|$name|$type|$request|$response|]";
		#print $_;
	}
}