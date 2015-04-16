## Copy & Paste Example ##
```
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script> 
<script type="text/javascript" src="http://yasq.googlecode.com/files/yasq.js"></script> 
<script>
$.yasq('delListItems',{
	site:'http://yoursite/your/page/',
	list:'Announcements',
	items:[4,5,6],
	success:function(results){
		$.each(results,function(i,row){
			if(row.status == 'success'){
				$('body').append('<hr>'+i+' was successful! (Note there is no longer an id for this item, obviously!)');
			}else{
				$('body').append('<hr>'+i+' row('+row.id+') had an error: <em>'+row.error+'</em>');	
			}
		});
	}
});
</script>
```

# Required #


---


### site ###
Default: <font color='#666666'><i>No default value</i></font>

Example:
```
site:'http://yoursite/your_page/',
```


---


## list ##
Default: <font color='#666666'><i>No default value</i></font>

Example 1:
```
list:'Announcements',
```
Example 2:
```
list:'{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}',
```

---


## items ##
Default: <font color='#666666'><i>No default value</i></font>

Example 1:
```
items:4,
```
Example 2:
```
items:[4,5,6],
```

# Optional #


---


## success ##
Default: <font color='#666666'><i>No default value</i></font>

Description: <font color='#666666'><i>Called on success, contains information about the individual items success/failure, and IDs.</i></font>

Example:
```
    success:function(results){
        $.each(results,function(i,row){
            if(row.status == 'success'){
                $('body').append('<hr>'+i+' was successful! (ID for it is '+row.ID+')');
            }else{
                $('body').append('<hr>'+i+' had an error: <em>'+row.error+'</em>');	
            }
        });
    }
```


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
