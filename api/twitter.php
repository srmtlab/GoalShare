<?php 
	//echo phpinfo();
	require_once('TwitterAPIExchange.php');
	
	class GoalshareAPI
	{
		public $API_BASE_URL = "http://localhost/api/";
		public $API_USER_URL = "user.pl";
		public $API_INSERT_GOAL_URL = "insert_goal.pl";
		public $API_INSERT_ISSUE_URL = "insert_issue.pl";
		
		
		public $BASE_GOAL_URI = "http://collab.open-opinion.org/resource/Goal/";
		public $BASE_ISSUE_URI = "http://collab.open-opinion.org/resource/Issue/";
		
		function addUser($username, $userSOMEURI, $userImageURI)
		{
			$fetchURL = $this->API_BASE_URL . $this->API_USER_URL . "?command=getFB&fbURI=$userSOMEURI";
			//echo $fetchURL;
			$res = json_decode( $this->getURL($fetchURL) );
			//echo $this->getURL($fetchURL);
			//echo "eeeeeeee". $res->person->personURI;
			if( $res && $res->person && $res->person->userURI )
				return $res->person->userURI;
			// Save the user
			$userURI = "http://collab.open-opinion.org/resource/Person/" . uniqid("", true);
			$createURL = $this->API_BASE_URL . $this->API_USER_URL . "?command=add&fbURI=$userSOMEURI&name=$username&imageURI=$userImageURI&userURI=$userURI";
			
			//echo "<br />" . $createURL . "<br />";
			$this->getURL($createURL);
			return $userURI;
		}
		
		function addGoal($goalURI, $title, $description, $reference, $creator){
			echo "add goal";
			$createURL = $this->API_BASE_URL . $this->API_INSERT_GOAL_URL . "?status=NotStarted&" .
					"goalURI=" . urlencode($goalURI).
					"&title=" . urlencode($title).
					"&reference=" . urlencode($reference).
					"&creator=" . urlencode($creator).
					"&description=" . urlencode($description);
			echo "<br />" . $createURL . "<br />";
			echo $this->getURL($createURL);
		}
		
		function addIssue($issueURI, $title, $description, $reference, $creator){
			echo "add issey";
			$createURL = $this->API_BASE_URL . $this->API_INSERT_ISSUE_URL . "?" .
					"issueURI=" . urlencode($issueURI).
					"&title=" . urlencode($title).
					"&creatorURI=" . urlencode($creator).
					"&description=" . urlencode($description).
					"&references=" . urlencode($reference);
			echo "<br />" . $createURL . "<br />";
			echo $this->getURL($createURL);
		}
		
		function getURL($url){
			$ch = curl_init();
			$timeout = 5;
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
			//$fields = array(
			//			'creatorURI' => urlencode("http://collab.open-opinion.org/resource/Person/37f7a5cd-9dda-16a3-8dec-f5b8e09ac510")
			//	);
			$data = curl_exec($ch);
			curl_close($ch);
			return $data;
		}
	}
	
	class TwitterAPI
	{
		public $Hashtags = array("#issue", "#goal");
		public $EventTags = array("#goalshare", "#opendataday");
		public $DB_USER = "gsuser";
		public $DB_PASS = "goalshare";
		public $DB_NAME = "Goalshare";
		public $DB_SERVER = "localhost";

		function getTweets($hashtag)
		{
			$settings = array(
    					'oauth_access_token' => "289914894-ac1rSYrbEhlmgZOPxipz5anHvTrw9TSPZar0x0Gk",
    					'oauth_access_token_secret' => "ehgrzv5JjdcvKTOFLEtUcr22K1ZkTfPJhgyHd0tr7sMUO",
    					'consumer_key' => "gbxvIREmwtbY8KEYJeZRg",
    					'consumer_secret' => "z5AEproiX3DZKCwPWxEaHn89PPG6Gw2yrlFtYg8WI"
					);
					$url = 'https://api.twitter.com/1.1/search/tweets.json';
					$getfield = '?q=' . urlencode( $hashtag );
					$requestMethod = 'GET';
					$twitter = new TwitterAPIExchange($settings);
					$result = $twitter->setGetfield($getfield)
						              ->buildOauth($url, $requestMethod)
						              ->performRequest();
					return $result;
		}
		
		function getURL($url){
			$ch = curl_init();
			$timeout = 5;
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
			//$fields = array(
			//			'creatorURI' => urlencode("http://collab.open-opinion.org/resource/Person/37f7a5cd-9dda-16a3-8dec-f5b8e09ac510")
			//	);
			$data = curl_exec($ch);
			curl_close($ch);
			return $data;
		}
		function saveTweet($id, $idSTR, $createdAt, $text, $userId, $userIdSTR, $userName, $screenName, $profileImageURL, $hashTags){
		 	$con=mysqli_connect($this->DB_SERVER,$this->DB_USER,$this->DB_PASS,$this->DB_NAME); 
			if (mysqli_connect_errno())
  			{
  				echo "Failed to connect to MySQL: " . mysqli_connect_error();
  			}
  			$query = "INSERT INTO Tweets( TweetID, TweetIDSTR, CreatedAt, Text, UserID, UserIDSTR, UserName, UserScreenName, UserImageURI, HashTags) VALUES ('$id', '$idSTR', '$createdAt', '$text', '$userId','$userIdSTR','$userName','$screenName','$profileImageURL','$hashTags')"; 			
 			//echo "[$query]";
 			mysqli_query($con,$query);
			mysqli_close($con);
		}
		function getProcessedTweets(){
			$result = array();
			$con=mysqli_connect($this->DB_SERVER,$this->DB_USER,$this->DB_PASS,$this->DB_NAME);
			if (mysqli_connect_errno())
				echo "Mysql error: " . mysqli_connection_error();
			$query = "SELECT DISTINCT TweetIDSTR FROM Tweets";
			$qres = mysqli_query($con, $query);
			while( $row = mysqli_fetch_array( $qres ) ){
				array_push($result, $row['TweetIDSTR']);
			}
			mysqli_close($con);
			return $result;
		}
		function get_hashtags($tweet)
		{
		    $matches = array();
    		preg_match_all('/\s+#(\w+)/', $tweet, $matches);//'/#\S*\w/i'
    		array_walk($matches[0], create_function('&$val', '$val = trim($val);')); 
    		return $matches[0];
		}
		
		
		
		function processTweet($tweet){
			
		}
		function runProcess(){
			$gsAPI = new GoalshareAPI();
			$result = $this->getTweets( "#goalshare AND #issue" );// implode( " OR ", $this->eventTags ) . " AND #goal OR #issue");
			$processedTweets = $this->getProcessedTweets();
			
			//var_dump($processedTweets);
			$rson = json_decode( $result );
			$json_string = json_encode($rson, JSON_PRETTY_PRINT);
			//echo "<br />[" .$json_string . "]<br />"; 
			for( $i = 0; $i < count($rson->statuses); $i++){
				// Check if already created
				if ( array_search( $rson->statuses[$i]->id_str, $processedTweets ) ){					
					echo "skip tweet";
					continue;
				}
				$hashtagsList =  $this->get_hashtags( $rson->statuses[$i]->text );
				//var_dump($hashtagsList);
				// Save tweet locally				
				$this->saveTweet(
					$rson->statuses[$i]->id,
					mysql_real_escape_string($rson->statuses[$i]->id_str),
					mysql_real_escape_string($rson->statuses[$i]->created_at),
					mysql_real_escape_string($rson->statuses[$i]->text),
					mysql_real_escape_string($rson->statuses[$i]->user->id),
					mysql_real_escape_string($rson->statuses[$i]->user->id_str),
					mysql_real_escape_string($rson->statuses[$i]->user->name),
					mysql_real_escape_string($rson->statuses[$i]->user->screen_name),
					mysql_real_escape_string($rson->statuses[$i]->user->profile_image_url),
					mysql_real_escape_string( implode( ";", $hashtagsList ) )
				);
	
				// Ensure that the user exists
				$userID = $gsAPI->addUser($rson->statuses[$i]->user->name,
										"https://twitter.com/account/redirect_by_id/" .$rson->statuses[$i]->user->id_str,
										$rson->statuses[$i]->user->profile_image_url);
			 //echo "User[$userID]";
				//echo in_array("#issue", $hashtagsList, false);
				var_dump($hashtagsList);
				if ( in_array("#goal", $hashtagsList, false) )
				{
					echo "creating a goal!<br />";
					$gsAPI->addGoal($gsAPI->BASE_GOAL_URI . $rson->statuses[$i]->id_str 
										,$rson->statuses[$i]->user->name . " @ Twitter", urlencode( $rson->statuses[$i]->text ),
										"http://twitter.com/" . $rson->statuses[$i]->user->id_str . "/status/" . $rson->statuses[$i]->id_str , 
										$userID );
				}
				elseif ( in_array("#issue", $hashtagsList, false) )
				{
					echo "creating an issue!".$gsAPI->BASE_ISSUE_URI . $rson->statuses[$i]->id_str."<br />";
					$gsAPI->addIssue($gsAPI->BASE_ISSUE_URI . $rson->statuses[$i]->id_str, 
										$rson->statuses[$i]->user->name . " @ Twitter", urlencode( $rson->statuses[$i]->text ),
										"http://twitter.com/" . $rson->statuses[$i]->user->id_str . "/status/" . $rson->statuses[$i]->id_str, 
										$userID );
				}
				else
				{
					echo "Nothing to do..";
				}
				
				
			}
		}
	}
	
	
	$twitter = new TwitterAPI();
	$twitter->runProcess();
	echo "<br />";
	echo "<br />";
	echo "<br />";
	
	//$gs = new GoalshareAPI();
	//echo $gs->addUser("name","some","image");
	//echo $gs->addGoal("uri","title","description", "ref", "creator" );	
	
	echo "\nend";
?>