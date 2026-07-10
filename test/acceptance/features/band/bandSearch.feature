@band
Feature: Search a band
  In order to search a band in the platform
  I want to receive band data

  Background:
    Given An authenticated user "test" with password "asdASD123"
    And they have a musician profile
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: An existing band is found
    Given I send a POST request to "/v1/bands" with body:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """
    Then the response status code should be 201
    When I send a GET request to "/v1/bands/#id"
    Then the response status code should be 200
    And the response with ignored fields "updatedAt,createdAt,ownerId,members" should be:
      """
      {
        "id": "#id",
        
        "name": "example"
        
      }
      """

  Scenario: A non-existing band is not found
    Given I send a GET request to "/v1/bands/53e88701-f222-4aef-bb9a-493de33475e7"
    Then the response status code should be 404
