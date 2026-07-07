Feature: Api health
  In order to know the server is up and running
  As a health check
  I want to check the api health

  Scenario: Check the api startup
    When I send a GET request to "/v1/startup"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "startup": "OK"
      }
      """

  Scenario: Check the api readiness
    When I send a GET request to "/v1/readiness"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "readiness": "OK"
      }
      """

  Scenario: Check the api liveness
    When I send a GET request to "/v1/liveness"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "liveness": "OK"
      }
      """
