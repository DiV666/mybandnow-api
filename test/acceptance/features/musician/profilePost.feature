@musician
Feature: Create musician profile
  In order to participate in bands
  As an authenticated user
  I want to create my musician profile

  Background:
    Given An authenticated user "daniel" with password "asdASD123!"

  Scenario: A valid profile is created
    Given I send a POST request to "/v1/profile" with body:
    """
    {
      "id": "e44d5c41-9fb9-4df1-8df6-9ec614ddf496",
      "name": "Daniel Musician",
      "username": "danielmusician"
    }
    """
    Then the response status code should be 201
    And the response should be empty
