# statement 页面输入状态冒烟

## Summary

- Status: PASS
- stopOnFailure: true
- totalSteps: 6
- executedSteps: 6
- passedSteps: 6
- failedSteps: 0

## Steps

### 1. navigate PASS

**Step**
```json
{
  "type": "navigate",
  "path": "pages/statement/statement",
  "transition": "reLaunch",
  "waitMs": 300
}
```

**Result**
```json
{
  "transition": "reLaunch",
  "url": "/pages/statement/statement",
  "activePage": {
    "path": "pages/statement/statement",
    "query": {}
  }
}
```

### 2. expectRoute PASS

**Step**
```json
{
  "type": "expectRoute",
  "path": "pages/statement/statement"
}
```

**Result**
```json
{
  "pass": true,
  "expected": "pages/statement/statement",
  "actual": "pages/statement/statement",
  "snapshot": {
    "path": "pages/statement/statement",
    "query": {}
  }
}
```

### 3. expectVisible PASS

**Step**
```json
{
  "type": "expectVisible",
  "selector": "textarea"
}
```

**Result**
```json
{
  "pass": true,
  "expected": true,
  "actual": true,
  "snapshot": {
    "selector": "textarea",
    "count": 1,
    "index": null
  }
}
```

### 4. input PASS

**Step**
```json
{
  "type": "input",
  "selector": "textarea",
  "value": "这是本地调试输入，不提交云端"
}
```

**Result**
```json
{
  "selector": "textarea",
  "innerSelector": null,
  "value": "这是本地调试输入，不提交云端"
}
```

### 5. expectData PASS

**Step**
```json
{
  "type": "expectData",
  "path": "answers.what",
  "expected": "这是本地调试输入，不提交云端"
}
```

**Result**
```json
{
  "pass": true,
  "expected": "这是本地调试输入，不提交云端",
  "actual": "这是本地调试输入，不提交云端",
  "pathResolved": true,
  "snapshot": {
    "path": "answers.what"
  }
}
```

### 6. snapshot PASS

**Step**
```json
{
  "type": "snapshot",
  "selectors": [
    "textarea",
    ".btn-primary"
  ],
  "dataPaths": [
    "answers.what",
    "canSubmit"
  ],
  "withData": false,
  "withElements": true,
  "withWxml": false,
  "limit": 10,
  "maxBytes": 50000
}
```

**Result**
```json
{
  "route": "pages/statement/statement",
  "query": {},
  "data": {
    "answers.what": "这是本地调试输入，不提交云端",
    "canSubmit": true
  },
  "selectors": [
    "textarea",
    ".btn-primary"
  ],
  "elementCount": 3,
  "elementsLimited": false,
  "processedSelectorCount": 2,
  "elementSummaryLimit": 100,
  "elements": [
    {
      "selector": "textarea",
      "index": 0,
      "tagName": "textarea",
      "text": "这是本地调试输入，不提交云端",
      "value": "这是本地调试输入，不提交云端",
      "size": {
        "width": 328,
        "height": 74
      },
      "offset": {
        "left": 51,
        "top": 218.390625
      }
    },
    {
      "selector": "textarea",
      "index": 1,
      "tagName": "textarea",
      "text": "示例：他说「你怎么又这样」的时候，我觉得所有委屈都白受了。\na",
      "value": "",
      "size": {
        "width": 328,
        "height": 74
      },
      "offset": {
        "left": 51,
        "top": 394.1875
      }
    },
    {
      "selector": ".btn-primary",
      "index": 0,
      "tagName": "view",
      "text": "呈上本庭",
      "value": null,
      "size": {
        "width": 374,
        "height": 59
      },
      "offset": {
        "left": 28,
        "top": 561.3828125
      }
    }
  ]
}
```
