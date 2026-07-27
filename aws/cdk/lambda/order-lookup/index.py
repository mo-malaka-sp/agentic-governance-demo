import json

ORDERS = {
    "1001": {"order_id": "1001", "status": "shipped", "item": "Widget Pro"},
    "1002": {"order_id": "1002", "status": "processing", "item": "Gadget X"},
}


def handler(event, context):
    action_group = event.get("actionGroup", "")
    function = event.get("function", "")
    parameters = {p["name"]: p["value"] for p in event.get("parameters", [])}

    order_id = parameters.get("order_id", "").strip()
    order = ORDERS.get(order_id, {"order_id": order_id, "status": "not_found", "item": None})

    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": action_group,
            "function": function,
            "functionResponse": {
                "responseBody": {
                    "TEXT": {
                        "body": json.dumps(order),
                    }
                }
            },
        },
    }
