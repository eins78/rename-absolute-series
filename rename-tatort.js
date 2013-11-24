var fs = require('fs-extra'),
    path = require('path'),
    async = require('async'),
    eyes = require('eyes'),
    args = require('optimist').argv,
    parseXML = require('xml2js').parseString;

// config
var cfg = {
  // dont rename by default
  // `--move` moves it
  "move": args.move || false,
  // `--copy` copies it
  "copy": args.copy || false,
  // where is the series?
  // `--src /path/to/Tatort/Season.01/
  "srcDir": args.src || args.source,
  // `--dest /path/to/new/folder/
  "destDir": args.dest || args.destination,
  // - what formats are movie files?
  "formats": /\.avi$|\.mp4$|\.m[ko]v$/,
  // `--xml tatort-tvdb.xml`
  "xmlSrc": args.xml || "./tatort-tvdb.xml",
  // `--renamer tatort-rename.json`
  "renamerSrc": args.renamer || "./tatort-rename.json"
}

var Renamer,
    LocalEpisodes;

// # Workflow

if (!cfg.srcDir) {
  fail("No source dir - try '--src /path/to/Tatort/Season.01/'")
}

try { // reading the rename data
  Renamer = require(cfg.renamerSrc);
} catch (err) {
  // ignore err
}

// if no rename data
if (!Renamer) {
  // build from XML if we have a src
  if (cfg.xmlSrc) {
    Renamer = buildRenamerFromTVDB(cfg.xmlSrc);
  } else {
    console.error("Neither rename data nor tvdb XML found!");
    process.exit(1);
  }
}

// Build local rename data
if (Renamer) {

    // read episodes from dir
    LocalEpisodes = readFileNames(cfg.srcDir);
    
    if (!LocalEpisodes.length) {
      fail('No local Episodes found');
    }
    else {
      console.log("Local Episodes: " + LocalEpisodes.length);
      
      async.eachSeries(LocalEpisodes, function (name, callback) {
        
        var ep = parseEpData(name);
        
        ep.newName = buildNewName(ep);
        
        console.log(ep.name, '>', ep.newName);
        
        if (cfg.move || cfg.copy) {
          
          if (!cfg.destDir) {
           fail("No destination directory") 
          }
          
          if (cfg.move) {
            fs.rename(
              path.join(cfg.srcDir, ep.name),
              path.join(cfg.destDir, ep.newName),
              callback
            );
          }
          else if (cfg.copy) {
            fs.copy(
              path.join(cfg.srcDir, ep.name),
              path.join(cfg.destDir, ep.newName), 
              callback
            );
          }
          
        }
        else {
          callback(null);
        }
        
      }, function (err) {
        if (err) { console.log(err); }
      });
      
    }
}



function buildRenamerFromTVDB(xmlfile) {
  
  fs.readFile(xmlfile, function (err, res) {
    if (err) {
      fail("Could not read tvdb XML file");
    }

    parseXML(res, function (err, res) {
    
      if (err) {
        fail("Could not parse tvdb XML file");
      }
    
        var rename = {};
      
        res.Data.Episode.forEach(function (ep) {
          rename[ep.absolute_number] = {
            "S": ep.SeasonNumber[0],
            "E": ep.EpisodeNumber[0]
          };
        });
      
        fs.outputJSONSync('tatort-rename.json', rename);
      
        return rename;
    });
    
  });
  
}

function readFileNames(dir) {
  var files = fs.readdirSync(cfg.srcDir);

  // filter: only movie files
  files = files.filter(function (ep) {
    return ep.match(cfg.formats);
  });
  
  return files;
}

function parseEpData(filename) {
  var rex = /Tatort.S01E(\d{1,3})\..*/;
  var a = filename.replace(rex, '$1');
  var e = path.extname(filename);
  
  return {
    "name": filename,
    "absNum": a,
    "ext": e
  };
}

function buildNewName(ep) {
  var d = Renamer[ep.absNum];
  
  var n = 'Tatort';
  n += '.S' + d.S;
  n += 'E' + (d.E<10?'0':'') + d.E;
  n += ep.ext;
  return n;
}

function fail(message) {
  console.error(message + "!");
  process.exit(1);
}

