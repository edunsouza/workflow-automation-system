# Simple Workflow Automation System

## The system
The Workflow Automation System consists of 3 core microservices:
- workflows service
- scheduler service
- runner service (actions processor)

They communicate async by producing and consuming Execution Request events. (See image 2 for flow details)

### [image 1]
![image](https://github.com/edunsouza/workflow-automation-system/blob/2c8944a976b5a27dabbb905a6ebeb95c3a7ea59f/hld-v1.png?raw=true)

### [image 2]
![image](https://github.com/edunsouza/workflow-automation-system/blob/main/lld-v1.png?raw=true)

## Running the services
There is a `docker-compose.yaml` file in the root of the project that runs 3 containers which are dependencies of the project:
- mongodb
- kafka
- zookeeper

There is also a `start-deps.sh` file in the root of the project that can be used to start these containers.

With MongoDB and Kafka running you can:
- start each microservice locally
- build the Dockerfile of each service

### Start locally
To run the services locally without docker you can:
- `npm i`
- `npm run build`
- `npm start`

### Using docker
In each of the folders `runner-svc`/`scheduler-svc`/`workflows-svc` there's a Dockerfile. To build each service you can:
- build the images with `docker build -t <chosen-image-name> /path/to/dockerfile`
- run the images with `docker run --name <service-name> -p 808x:808x <chosen-image-name>`

## Creating a workflow
To create a workflow you need to use the `workflows-svc` API. Here's an example of a payload for a periodic workflow:

```
POST /workflows
{
  "workflowId": "recurrent-workflow",
  "trigger": {
    "type": "periodic", # available types: ["periodic", "manual"]
    "interval": "10s" # required if type is "periodic". Units are: [s, m, h]
  },
  "actions": [{
    "type": "http-request",  # available actions: ["log", "http-request"]
    "url": "https://google.com",
    "method": "GET"
  }]
}
```

If the workflow is `manual` you can manually trigger it via the API with:
```
POST workflows/<workflow_id>/trigger
```

If the workflow is `periodic` it will be executed by the `scheduler-svc` every `@interval`. The `scheduler-svc` service runs every 5s by default.

## Error handling
If the `runner-svc` fails to execute one action from the workflow it will track the attempt and schedule a retry after X seconds with exponential backoff based on the amount of retries. The `scheduler-svc` will reschedule that pending workflow and `runner-svc` will retry it until `retries` reach 0. After all retries, the workflow execution is marked as `failed`.

## Known issues
### Manual workflow
Currently if you create a manual workflow you can trigger it how many times you want (rate limit yet). On top of that, there's no control for the workflow state of "pending" (failed / in backoff mode) so you can trigger the workflow sequentially and, if it fails all attempts, waste the retries immediately.
#### Solution
To fix that we can add a field to `trigger` in `workflows` collection. We can simply add a `trigger.status` of "busy" or "pending" to indicate to the `workflow-svc` that this workflow needs retry so it can return the proper status to the users and prevent another trigger while in that state. The responsible to manage that new field would be `runner-svc` to set and unset when executions fail/complete.

## Tests
There are no unit/e2e tests written yet but the project was designed for dependency injection and modular code. Entities that hold business logic, like Service/Worker/Job, export the classes/functions to be tested and also a default instance to be used as a singleton in the project.

## Other
Logs, metrics and health checks are suggested in the code. Http routes are modular so we could easily add a `/v2` API. SOLID principles and design patterns are applied.
