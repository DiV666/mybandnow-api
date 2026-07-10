@band
Feature: Remove an existing band
  In order to delete a band
  I want to remove it from the platform

  Background:
    Given An authenticated user "test" with password "asdASD123"
    And they have a musician profile
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: An existing band is removed
    When I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201
    When I send a DELETE request to "/v1/bands/#id"
    Then the response status code should be 204

  Scenario: Attempt to remove a non-existing band (Idempotent)
    When I send a DELETE request to "/v1/bands/a38c2ebf-85fb-4c88-aa8e-b4bbe1e17117"
    Then the response status code should be 204
