@band
Feature: Match band by criteria
  In order to find band in the platform
  I want to receive a list of band data

  Background:
    Given An authenticated user "test" with password "asdASD123"
    And they have a musician profile
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: An existing band is found by criteria
    Given I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201
    When I send a GET request to "/v1/bands?criteria=%7B%22filters%22%3A%5B%7B%22field%22%3A%22_id%22%2C%22operator%22%3A%22EQUAL%22%2C%22type%22%3A%22array%22%2C%22value%22%3A%5B%22#id%22%5D%7D%5D%7D"
    Then the response status code should be 200
    And the response with ignored fields "items.updatedAt,items.createdAt,items.ownerId,items.members" should be:
      """
      {
        "items": [
          {
            "id": "#id",
        
        "name": "example"
        
          }
        ],
        "total": 1
      }
      """
