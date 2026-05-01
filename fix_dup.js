const fs = require("fs");
let c = fs.readFileSync("./backend/routes/auth.js", "utf8");

// Count occurrences of 'const siteOrigin = getPublicSiteOrigin()'
const matches = c.match(/const siteOrigin = getPublicSiteOrigin\(\)/g);
console.log("Found", matches ? matches.length : 0, "occurrences of siteOrigin");

// Simpler approach: find the section after "Promotional email sent to" and remove everything until the matching catch block ends
// Find the position of "Promotional email sent to " + successCount
const searchStr =
  'res.json({ message: "Promotional email sent to " + successCount + " recipient(s) successfully." });';
const idx = c.indexOf(searchStr);

if (idx !== -1) {
  console.log("Found success message at position", idx);

  // Find the closing of this else block - look for '}\n    } catch' pattern after this
  // Starting from idx, find '}\n    } catch (err) {'
  const afterSuccess = c.substring(idx);
  const catchStart = afterSuccess.indexOf("} catch (err) {");
  const closingIdx = afterSuccess.indexOf("},", catchStart);

  if (catchStart !== -1 && closingIdx !== -1) {
    // Find start of the section to remove - find 'const siteOrigin' after success message
    const sectionStart = afterSuccess.indexOf(
      "const siteOrigin = getPublicSiteOrigin()",
    );
    const sectionEnd = afterSuccess.indexOf("},", sectionStart + 10);

    if (sectionStart !== -1 && sectionEnd !== -1) {
      console.log(
        "Found duplicate section from",
        sectionStart,
        "to",
        sectionEnd + 2,
      );

      // Create the fixed version - just keep success response and catch block
      const beforeSection = c.substring(0, idx + searchStr.length + 1); // include the closing });
      const endSection = c.substring(closingIdx + 2);

      // Replace with fixed version
      const fixed =
        beforeSection +
        '\n    } catch (err) {\n      console.error("Error sending promotional email:", err);\n      res.status(500).json({ message: "Could not send promotional email." });\n    }\n  },\n);' +
        endSection;

      fs.writeFileSync("./backend/routes/auth.js", fixed);
      console.log("SUCCESS: Fixed duplicate siteOrigin!");
    } else {
      console.log("Could not find section boundaries");
    }
  } else {
    console.log("Could not find catch block");
  }
} else {
  console.log("Could not find success message");
}
