import os
import requests

API_KEY = os.getenv("API_KEY")
PYTHON_TYPE_LOOKUP = {
    "string": "str",
    "boolean": "bool",
    "number": "int | float",
    "object": "dict",
}


def format_id(id: str):
    words = id.split("_")
    output = ""
    for word in words:
        output += word.capitalize()
        output += " "
    return output.strip()


def get_nice_schema(transformation_schema):
    inputs = [
        f'\t\t"{key}": ...,'
        for key, value in transformation_schema["properties"].items()
    ]
    return "\t{\n" + "\n".join(inputs) + "\n\t}"


def generate_docstring_from_schema(transformation_schema):
    output = """    
"""
    for key, value in transformation_schema["properties"].items():
        try:
            key_type = PYTHON_TYPE_LOOKUP.get(value["type"], "Any")
        except:
            key_type = "Any"

        metadata = value.get("metadata", {})
        description: str = metadata.get("description")
        info_line = f"- `{key}`: {key_type}"

        if description is not None:
            description = description.translate(
                str.maketrans(
                    {
                        "{": "\{",
                        "}": "\}",
                        "[": "\[",
                        "]": "\]",
                    }
                )
            )
            info_line += f"\n\t{description}"

        info_line += "\n"

        output += info_line

    return output


def generate_markdown(transformation_schema):
    transformation_id = transformation_schema["transformation_id"]
    return f"""
### {format_id(transformation_id)}

{transformation_schema["description"]}

**Arguments**
{generate_docstring_from_schema(transformation_schema["input_schema"])}
**Returns**
{generate_docstring_from_schema(transformation_schema["output_schema"])}

```python Python
response = run_step(
    "{transformation_id}",
{get_nice_schema(transformation_schema["input_schema"])}
)
```
"""


def main():
    transformations = requests.get(
        url="https://api-f1db6c.stack.tryrelevance.com/latest/studios/transformations/list",
        # headers={"Authorization": API_KEY},
    ).json()

    markdown = """---
title: "Tool Builder Transformations in the Python Code Step"
sidebardTitle: "Tool Builder Transformations (Advanced)"
description: "Relevance AI Tool Builder Transformations as Helper Functions"
---

All transformations available in our tool builder are also supported from our python code step.

## **Studio Transformations**
"""
    for transformation_schema in transformations["results"]:
        if not transformation_schema.get("hidden", False):
            markdown += generate_markdown(transformation_schema)

    with open(
        "tool/tool-steps/python-code/code-studio-transformation-python-helper-functions.mdx",
        "w",
    ) as f:
        f.write(markdown)


if __name__ == "__main__":
    main()
