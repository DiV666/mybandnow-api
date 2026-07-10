@band
Feature: Create a new band
  In order to have create band in the platform
  I want to create a new band

  Background:
    Given An authenticated user "test" with password "asdASD123"
    And they have a musician profile
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: A valid unexisting band is created
    When I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201

  Scenario: Idempotent creation of an existing band
    Given I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201
    When I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201
