/*
Copyright 2014 Extensions of Logic Programming - Universitat Politècnica de València

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to use, 
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the 
Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

package es.upv.dsic.elp.Anima;

import java.net.UnknownHostException;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.MongoClient;

public class MongoDB {
	public static String loadData(String maudeInput) {
		String res = null;
		MongoClient mongo;
		DB db;
		
        //WARNING: Configure with your own data
		try { mongo = new MongoClient("YOUR_SERVER_ADDRESS",YOUR_SERVER_PORT); }
		catch (UnknownHostException e) { return null; }
		
		db = mongo.getDB("anima");
        //WARNING: Configure with your own data
		boolean auth = db.authenticate("YOUR_USER", "YOUR_PASSWORD".toCharArray());
		if (auth){
			DBCollection table = db.getCollection("anima");
			BasicDBObject searchQuery = new BasicDBObject();
			searchQuery.put("input", maudeInput);
		 
			DBCursor cursor = table.find(searchQuery);
			if (cursor.hasNext())
				res = cursor.next().get("output").toString();
		}
		mongo.close();
		return res;
	}
	
	public static void saveData(String maudeInput, String maudeOutput) {
		MongoClient mongo;
		DB db;
		
		//WARNING: Configure with your own data
		try { mongo = new MongoClient("YOUR_SERVER_ADDRESS",YOUR_SERVER_PORT); }
		catch (UnknownHostException e) { return; }
		
		db = mongo.getDB("anima");
		//WARNING: Configure with your own data
		boolean auth = db.authenticate("YOUR_USER", "YOUR_PASSWORD".toCharArray());
		if (auth){
			DBCollection table = db.getCollection("anima");
			BasicDBObject document = new BasicDBObject();
			document.put("input", maudeInput);
			document.put("output", maudeOutput);
			table.insert(document);
		}
		mongo.close();
	}
}
