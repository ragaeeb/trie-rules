import { h } from "preact";
import { useState } from "preact/hooks";
import { buildTrie, searchAndReplace } from "trie-rules";
import "./app.css"; // This line should be at the top of your file
import packageInfo from "../package.json";
import defaultRules from "./defaultRules.json";
import defaultText from "./defaultText.txt?raw";

export function App() {
  const [rules, setRules] = useState(
    JSON.stringify(defaultRules.searchReplaceRules, null, 2)
  );
  const [text, setText] = useState(defaultText);

  const handleRulesChange = (event) => {
    setRules(event.target.value);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleProcessText = () => {
    try {
      const parsedRules = JSON.parse(rules);
      const trie = buildTrie(parsedRules);
      const replacedText = searchAndReplace(trie, text, {
        confirmCallback: (options) => {
          console.log("options", options);
          return false;
        },
      });
      setText(replacedText);
    } catch (error) {
      alert("Error parsing rules or processing text: " + error.message);
    }
  };

  return (
    <div>
      <h1>Trie-Rules v{packageInfo.dependencies["trie-rules"]} Demo</h1>
      <div>
        <textarea
          value={rules}
          rows="18"
          onChange={handleRulesChange}
          placeholder="Enter rules in JSON format"
        />
        <br />
        <textarea
          value={text}
          style={{ minWidth: "100%" }}
          onChange={handleTextChange}
          placeholder="Enter text to format"
        />
        <button onClick={handleProcessText}>Process Text</button>
      </div>
    </div>
  );
}
