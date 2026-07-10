@band
Feature: Update an existing band
  In order to modify a band
  I want to update its data

  Background:
    Given An authenticated user "test" with password "asdASD123"
    And they have a musician profile
    Given I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "a4b6b3f0-0b1a-4b1a-8f0a-0b1a4b1a8f0a",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201

  Scenario: An existing band is updated
    When I send a PUT request to "/v1/bands/a4b6b3f0-0b1a-4b1a-8f0a-0b1a4b1a8f0a" with body:
      """
      {
        
        "name": "example"
        
      }
      """
    Then the response status code should be 200

  Scenario: Attempt to update a non-existing band
    When I send a PUT request to "/v1/bands/53e88701-f222-4aef-bb9a-493de33475e7" with body:
      """
      {
        
        "name": "example"
        
      }
      """
    Then the response status code should be 404
