## Copy & Paste Example ##
```
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script> 
<script type="text/javascript" src="http://yasq.googlecode.com/files/yasq.js"></script> 
<script>
$.yasq('getCurrentUserData',{
	site:'https://mysite/',
	success:function(userData){
		for(property in userData){
			//alert(property + '\n' + userData[property]);
		}	
	}
});</script>
```

# Required #


---


### site ###
Default: <font color='#666666'><i>Defaults to site specified using $.yasq()</i></font>

Example:
```
site:'http://yoursite/your_page/',
```


---


## success ##
Default: <font color='#666666'><i>No default value</i></font>

Description: <font color='#666666'><i>Called on success, contains information about the individual items success/failure, and IDs.</i></font>

Example:
```
	success:function(userData){
		for(property in userData){
			//alert(property + '\n' + userData[property]);
		}	
	}
```


---


# Optional #


---


## error ##
Default: <font color='#666666'><i>No default value</i></font>

Description: <font color='#666666'><i>Called only on errors that prevent the action from taking place (eg SOAP errors). Errors on individual items are handled in the success handler.</i></font>

Example:
```
	error:function(errorMsg){
		alert('The default error message handler just alerts the error, '
		+'this handler is called only when something that has prevented the '
		+'operation from occuring (eg. a SOAP error) has occured.\n'+errorMsg);
	}
```


---
